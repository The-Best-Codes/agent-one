use axum::{
    extract::{Query, State},
    response::Html,
    routing::get,
    Router,
};
use rmcp::transport::auth::{
    AuthError, AuthorizationManager, CredentialStore, OAuthState, StoredCredentials,
};
use serde::Deserialize;
use std::collections::HashMap;
use std::net::SocketAddr;
use std::sync::Arc;
use std::time::Duration;
use tauri_plugin_opener::OpenerExt;
use tokio::sync::{oneshot, Mutex};
use url::Url;

use crate::keyring::{delete_password, get_password, set_password};

pub struct AuthCancellationState(pub Arc<Mutex<HashMap<String, oneshot::Sender<()>>>>);
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
        match get_password(&self.key()).await {
            Ok(Some(json)) => {
                let creds: StoredCredentials = serde_json::from_str(&json)
                    .map_err(|e| AuthError::InternalError(format!("JSON parse error: {}", e)))?;
                Ok(Some(creds))
            }
            Ok(None) => Ok(None),
            Err(e) => Err(AuthError::InternalError(e)),
        }
    }

    async fn save(&self, credentials: StoredCredentials) -> Result<(), AuthError> {
        let json = serde_json::to_string(&credentials)
            .map_err(|e| AuthError::InternalError(format!("JSON serialize error: {}", e)))?;

        set_password(&self.key(), &json)
            .await
            .map_err(AuthError::InternalError)
    }

    async fn clear(&self) -> Result<(), AuthError> {
        delete_password(&self.key())
            .await
            .map(|_| ())
            .map_err(AuthError::InternalError)
    }
}

async fn callback_handler(
    Query(params): Query<CallbackParams>,
    State(state): State<AppState>,
) -> Html<&'static str> {
    if let Some(sender) = state.code_receiver.lock().await.take() {
        let _ = sender.send(params);
    }
    Html(include_str!("../static/mcp_oauth_callback.html"))
}

#[tauri::command]
pub async fn mcp_authenticate(
    app: tauri::AppHandle,
    state: tauri::State<'_, AuthCancellationState>,
    server_id: String,
    server_url: String,
) -> Result<String, String> {
    // Setup Callback Server (Bind to port 0 to let OS assign free port)
    let addr = SocketAddr::from(([127, 0, 0, 1], 0));
    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .map_err(|e| e.to_string())?;

    let port = listener.local_addr().map_err(|e| e.to_string())?.port();
    let redirect_uri = format!("http://127.0.0.1:{}/callback", port);

    let (code_sender, code_receiver) = oneshot::channel::<CallbackParams>();
    let app_state = AppState {
        code_receiver: Arc::new(Mutex::new(Some(code_sender))),
    };

    let router = Router::new()
        .route("/callback", get(callback_handler))
        .with_state(app_state);

    let server_handle = tokio::spawn(async move { axum::serve(listener, router).await });

    let scopes = &["mcp", "profile", "email"];
    let client_name = Some("AgentOne");

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

    app.opener()
        .open_url(&auth_url, None::<&str>)
        .map_err(|e| format!("Failed to open browser: {}", e))?;

    let (cancel_tx, cancel_rx) = oneshot::channel::<()>();

    {
        let mut map = state.0.lock().await;
        map.insert(server_id.clone(), cancel_tx);
    }

    // Wait for code with timeout or cancellation
    let params_result = tokio::select! {
        res = tokio::time::timeout(Duration::from_secs(OAUTH_CALLBACK_TIMEOUT_SECS), code_receiver) => {
             match res {
                Ok(Ok(params)) => Ok(params),
                Ok(Err(_)) => Err("Failed to receive authorization code (channel closed)".to_string()),
                Err(_) => Err(format!("OAuth flow timed out after {} seconds", OAUTH_CALLBACK_TIMEOUT_SECS)),
            }
        },
        _ = cancel_rx => {
            Err("OAuth flow cancelled by user".to_string())
        }
    };

    {
        let mut map = state.0.lock().await;
        map.remove(&server_id);
    }

    server_handle.abort();

    let params = params_result?;

    oauth_state
        .handle_callback(&params.code, &params.state)
        .await
        .map_err(|e| format!("Failed to exchange code: {}", e))?;

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

    Ok("Authentication successful".to_string())
}

#[tauri::command]
pub async fn mcp_cancel_auth(
    state: tauri::State<'_, AuthCancellationState>,
    server_id: String,
) -> Result<(), String> {
    let mut map = state.0.lock().await;
    if let Some(tx) = map.remove(&server_id) {
        let _ = tx.send(());
        Ok(())
    } else {
        Ok(())
    }
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
