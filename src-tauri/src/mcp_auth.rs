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
use url::Url;

const KEYRING_SERVICE: &str = "com.agentone.app";

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
        .start_authorization(scopes, redirect_uri, client_name)
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

// Helper to attempt token retrieval with a specific URL

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

    // 3. Setup Scopes (Default)
    let scopes = &["mcp"];
    let client_name = Some("AgentOne");

    // 4. Init OAuth State & Start Authorization with Fallback
    let mut oauth_state =
        match initialize_and_start_auth(&server_url, scopes, &redirect_uri, client_name).await {
            Ok(state) => state,
            Err(e) => {
                // If the error indicates missing auth support, try fallback
                // We blindly try fallback if the first one failed, hoping it works.
                if let Some(origin_url) = get_origin_url(&server_url) {
                    initialize_and_start_auth(&origin_url, scopes, &redirect_uri, client_name)
                        .await
                        .map_err(|e2| {
                            format!(
                                "Failed to start authorization on both {} ({}) and {} ({})",
                                server_url, e, origin_url, e2
                            )
                        })?
                } else {
                    return Err(format!("Failed to start authorization: {}", e));
                }
            }
        };

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

    // 1. Try with exact URL
    match try_get_token_with_url(&server_id, &server_url).await {
        Ok(token) => return Ok(token),
        Err(e) => {
            // 2. If exact URL failed, try fallback if possible
            if let Some(origin_url) = get_origin_url(&server_url) {
                // If this succeeds, great. If not, return the original error or a combined one.
                match try_get_token_with_url(&server_id, &origin_url).await {
                    Ok(token) => return Ok(token),
                    Err(e2) => {
                        // Fallback also failed.
                        // Log or return error. Usually the first error is more relevant if the user intended that URL.
                        // But if the auth was done on origin, e2 might be the "real" error (e.g. expired token).
                        // However, if the first failed because "No auth support" (invalid config) and second failed because "Expired",
                        // we want the second error.
                        // It's hard to distinguish without error codes.
                        // Let's return a combined error for debuggability.
                        return Err(format!(
                            "Primary URL failed: {}. Origin URL failed: {}",
                            e, e2
                        ));
                    }
                }
            }
            // No fallback possible, return original error
            return Err(e);
        }
    }
}
