use axum::{
    extract::{Query, State},
    response::Html,
    routing::get,
    Router,
};
use keyring::{Entry, Error as KeyringError};
use rmcp::transport::auth::{
    AuthError, AuthorizationManager, CredentialStore, OAuthState, StoredCredentials,
};
use serde::Deserialize;
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::sync::{oneshot, Mutex};

const KEYRING_SERVICE: &str = "com.agentone.app";

#[derive(Clone)]
struct AppState {
    code_receiver: Arc<Mutex<Option<oneshot::Sender<CallbackParams>>>>,
}

#[derive(Debug, Deserialize)]
struct CallbackParams {
    code: String,
    state: String,
}

#[derive(Clone)]
pub struct KeyringCredentialStore {
    server_id: String,
}

impl KeyringCredentialStore {
    pub fn new(server_id: String) -> Self {
        Self { server_id }
    }

    fn key(&self) -> String {
        format!("mcp_auth_{}", self.server_id)
    }
}

#[async_trait::async_trait]
impl CredentialStore for KeyringCredentialStore {
    async fn load(&self) -> Result<Option<StoredCredentials>, AuthError> {
        let key = self.key();
        let service = KEYRING_SERVICE.to_string();

        let result = tokio::task::spawn_blocking(move || {
            let entry = Entry::new(&service, &key)
                .map_err(|e| AuthError::InternalError(format!("Keyring error: {}", e)))?;
            match entry.get_password() {
                Ok(json) => {
                    let creds: StoredCredentials = serde_json::from_str(&json).map_err(|e| {
                        AuthError::InternalError(format!("JSON parse error: {}", e))
                    })?;
                    Ok::<Option<StoredCredentials>, AuthError>(Some(creds))
                }
                Err(KeyringError::NoEntry) => Ok::<Option<StoredCredentials>, AuthError>(None),
                Err(e) => Err(AuthError::InternalError(format!(
                    "Keyring get error: {}",
                    e
                ))),
            }
        })
        .await
        .map_err(|e| AuthError::InternalError(format!("Join error: {}", e)))??;

        Ok(result)
    }

    async fn save(&self, credentials: StoredCredentials) -> Result<(), AuthError> {
        let key = self.key();
        let service = KEYRING_SERVICE.to_string();
        let json = serde_json::to_string(&credentials)
            .map_err(|e| AuthError::InternalError(format!("JSON serialize error: {}", e)))?;

        tokio::task::spawn_blocking(move || {
            let entry = Entry::new(&service, &key)
                .map_err(|e| AuthError::InternalError(format!("Keyring error: {}", e)))?;
            entry
                .set_password(&json)
                .map_err(|e| AuthError::InternalError(format!("Keyring set error: {}", e)))?;
            Ok::<(), AuthError>(())
        })
        .await
        .map_err(|e| AuthError::InternalError(format!("Join error: {}", e)))??;

        Ok(())
    }

    async fn clear(&self) -> Result<(), AuthError> {
        let key = self.key();
        let service = KEYRING_SERVICE.to_string();

        tokio::task::spawn_blocking(move || {
            let entry = Entry::new(&service, &key)
                .map_err(|e| AuthError::InternalError(format!("Keyring error: {}", e)))?;
            match entry.delete_credential() {
                Ok(_) => Ok::<(), AuthError>(()),
                Err(KeyringError::NoEntry) => Ok::<(), AuthError>(()),
                Err(e) => Err(AuthError::InternalError(format!(
                    "Keyring delete error: {}",
                    e
                ))),
            }
        })
        .await
        .map_err(|e| AuthError::InternalError(format!("Join error: {}", e)))??;

        Ok(())
    }
}

async fn callback_handler(
    Query(params): Query<CallbackParams>,
    State(state): State<AppState>,
) -> Html<String> {
    if let Some(sender) = state.code_receiver.lock().await.take() {
        let _ = sender.send(params);
    }
    Html("<h1>Authentication Successful</h1><p>You can close this window and return to AgentOne.</p>".to_string())
}

#[tauri::command]
pub async fn mcp_authenticate(server_id: String, server_url: String) -> Result<String, String> {
    // 1. Find a free port
    let port = portpicker::pick_unused_port().ok_or("No free ports available")?;
    let redirect_uri = format!("http://127.0.0.1:{}/callback", port);

    // 2. Start callback server
    let (code_sender, code_receiver) = oneshot::channel::<CallbackParams>();
    let app_state = AppState {
        code_receiver: Arc::new(Mutex::new(Some(code_sender))),
    };

    let app = Router::new()
        .route("/callback", get(callback_handler))
        .with_state(app_state);

    let addr = SocketAddr::from(([127, 0, 0, 1], port));
    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .map_err(|e| e.to_string())?;

    // Spawn server
    let server_handle = tokio::spawn(async move { axum::serve(listener, app).await });

    // 3. Init OAuth State
    let mut oauth_state = OAuthState::new(&server_url, None)
        .await
        .map_err(|e| format!("Failed to init OAuth state: {}", e))?;

    // 4. Start Authorization
    // We use "mcp" scope as default? The example used ["mcp", "profile", "email"]
    // TODO: Should we get scopes from somewhere?
    // The rmcp example: &["mcp", "profile", "email"]
    // Let's assume standard scopes or empty.
    // OAuthState::start_authorization takes scopes.
    let scopes = &["mcp"];

    oauth_state
        .start_authorization(scopes, &redirect_uri, Some("AgentOne"))
        .await
        .map_err(|e| format!("Failed to start authorization: {}", e))?;

    let auth_url = oauth_state
        .get_authorization_url()
        .await
        .map_err(|e| e.to_string())?;

    // 5. Open Browser
    open::that(&auth_url).map_err(|e| format!("Failed to open browser: {}", e))?;

    // 6. Wait for code
    let params = code_receiver
        .await
        .map_err(|_| "Failed to receive authorization code (channel closed)".to_string())?;

    // 7. Handle callback (Exchange code)
    oauth_state
        .handle_callback(&params.code, &params.state)
        .await
        .map_err(|e| format!("Failed to exchange code: {}", e))?;

    // 8. Save credentials
    let (client_id, token_response) = oauth_state
        .get_credentials()
        .await
        .map_err(|e| e.to_string())?;

    let cred_store = KeyringCredentialStore::new(server_id);
    cred_store
        .save(StoredCredentials {
            client_id,
            token_response,
        })
        .await
        .map_err(|e| e.to_string())?;

    // Stop server
    server_handle.abort();

    Ok("Authentication successful".to_string())
}

#[tauri::command]
pub async fn mcp_get_token(server_id: String, server_url: String) -> Result<String, String> {
    let cred_store = KeyringCredentialStore::new(server_id);

    // Check if we have creds
    let loaded = cred_store.load().await.map_err(|e| e.to_string())?;
    if loaded.is_none() {
        return Err("No credentials found. Please login.".to_string());
    }

    // Use AuthorizationManager to handle refresh if needed
    let mut auth_manager = AuthorizationManager::new(&server_url)
        .await
        .map_err(|e| e.to_string())?;
    auth_manager.set_credential_store(cred_store);

    if auth_manager
        .initialize_from_store()
        .await
        .map_err(|e| e.to_string())?
    {
        // Refresh checks expiration automatically
        auth_manager
            .refresh_token()
            .await
            .map_err(|e| e.to_string())?;

        let token = auth_manager
            .get_access_token()
            .await
            .map_err(|e| e.to_string())?;
        Ok(token)
    } else {
        Err("Failed to initialize from store".to_string())
    }
}
