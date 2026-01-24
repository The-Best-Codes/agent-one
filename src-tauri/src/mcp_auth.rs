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
use std::time::Duration;
use tokio::sync::{oneshot, Mutex};
use url::Url;

const KEYRING_SERVICE: &str = "com.agentone.app";
const OAUTH_CALLBACK_TIMEOUT_SECS: u64 = 300;

const CLIENT_METADATA_URL: &str = "https://raw.githubusercontent.com/modelcontextprotocol/rust-sdk/refs/heads/main/client-metadata.json";

async fn initialize_and_start_auth(
    url: &str,
    scopes: &[&str],
    redirect_uri: &str,
    client_name: Option<&str>,
) -> Result<OAuthState, String> {
    let mut state = OAuthState::new(url, None)
        .await
        .map_err(|e| e.to_string())?;
    state
        .start_authorization_with_metadata_url(
            scopes,
            redirect_uri,
            client_name,
            Some(CLIENT_METADATA_URL),
        )
        .await
        .map_err(|e| e.to_string())?;
    Ok(state)
}

fn get_origin_url(url: &str) -> Option<String> {
    if let Ok(mut parsed) = Url::parse(url) {
        if parsed.path() != "/" && !parsed.path().is_empty() {
            parsed.set_path("");
            parsed.set_query(None);
            parsed.set_fragment(None);
            let origin_str = parsed.to_string();

            if origin_str != url && origin_str.trim_end_matches('/') != url.trim_end_matches('/') {
                return Some(origin_str);
            }
        }
    }
    None
}

async fn try_with_origin_fallback<T, F, Fut>(primary_url: &str, operation: F) -> Result<T, String>
where
    F: Fn(String) -> Fut,
    Fut: std::future::Future<Output = Result<T, String>>,
{
    match operation(primary_url.to_string()).await {
        Ok(result) => Ok(result),
        Err(primary_err) => {
            if let Some(origin_url) = get_origin_url(primary_url) {
                match operation(origin_url.clone()).await {
                    Ok(result) => Ok(result),
                    Err(origin_err) => Err(format!(
                        "Primary URL failed: {}. Origin URL failed: {}",
                        primary_err, origin_err
                    )),
                }
            } else {
                Err(primary_err)
            }
        }
    }
}

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
    // 1. Setup Callback Server (Bind to port 0 to let OS assign free port)
    let addr = SocketAddr::from(([127, 0, 0, 1], 0));
    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .map_err(|e| e.to_string())?;

    let port = listener.local_addr().map_err(|e| e.to_string())?.port();
    let redirect_uri = format!("http://127.0.0.1:{}/callback", port);

    // 2. Prepare App State
    let (code_sender, code_receiver) = oneshot::channel::<CallbackParams>();
    let app_state = AppState {
        code_receiver: Arc::new(Mutex::new(Some(code_sender))),
    };

    let app = Router::new()
        .route("/callback", get(callback_handler))
        .with_state(app_state);

    // Spawn server
    let server_handle = tokio::spawn(async move { axum::serve(listener, app).await });

    // 3. Setup Scopes (Aligned with official SDK)
    let scopes = &["mcp", "profile", "email"];
    let client_name = Some("AgentOne");

    // 4. Init OAuth State & Start Authorization with Fallback
    let redirect_uri_clone = redirect_uri.clone();
    let mut oauth_state = try_with_origin_fallback(&server_url, |url| {
        let redirect = redirect_uri_clone.clone();
        async move { initialize_and_start_auth(&url, scopes, &redirect, client_name).await }
    })
    .await?;

    let auth_url = oauth_state
        .get_authorization_url()
        .await
        .map_err(|e| e.to_string())?;

    // 5. Open Browser
    open::that(&auth_url).map_err(|e| format!("Failed to open browser: {}", e))?;

    // 6. Wait for code with timeout
    let params = tokio::time::timeout(
        Duration::from_secs(OAUTH_CALLBACK_TIMEOUT_SECS),
        code_receiver,
    )
    .await
    .map_err(|_| {
        format!(
            "OAuth flow timed out after {} seconds",
            OAUTH_CALLBACK_TIMEOUT_SECS
        )
    })?
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

// Helper to attempt token retrieval with a specific URL
async fn try_get_token_with_url(server_id: &str, url: &str) -> Result<String, String> {
    let cred_store = KeyringCredentialStore::new(server_id.to_string());

    // AuthorizationManager::new might return Ok even if config is bad,
    // so we must proceed to check if it actually works with stored creds.
    let mut auth_manager = AuthorizationManager::new(url)
        .await
        .map_err(|e| e.to_string())?;

    auth_manager.set_credential_store(cred_store);

    // Initialize from store checks if creds exist and are compatible
    let initialized = auth_manager
        .initialize_from_store()
        .await
        .map_err(|e| e.to_string())?;

    if initialized {
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

#[tauri::command]
pub async fn mcp_logout(server_id: String) -> Result<(), String> {
    let cred_store = KeyringCredentialStore::new(server_id);
    cred_store.clear().await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn mcp_get_token(server_id: String, server_url: String) -> Result<String, String> {
    let cred_store = KeyringCredentialStore::new(server_id.clone());

    // Check if we have creds at all first
    let loaded = cred_store.load().await.map_err(|e| e.to_string())?;
    if loaded.is_none() {
        return Err("No credentials found. Please login.".to_string());
    }

    try_with_origin_fallback(&server_url, |url| {
        let id = server_id.clone();
        async move { try_get_token_with_url(&id, &url).await }
    })
    .await
}
