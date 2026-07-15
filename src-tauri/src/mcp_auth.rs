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
use std::path::PathBuf;
use std::sync::Arc;
use std::time::Duration;
use tauri_plugin_opener::OpenerExt;
use tokio::sync::{oneshot, Mutex};

use crate::keyring::{delete_password, get_password, resolve_agent_db_path, set_password};

pub struct AuthCancellationState(pub Arc<Mutex<HashMap<String, oneshot::Sender<()>>>>);
const OAUTH_CALLBACK_TIMEOUT_SECS: u64 = 300;

fn get_client_metadata_url(port: u16) -> String {
    format!(
        "https://www.agent-one.dev/api/mcp-oauth/client-metadata.json?port={}",
        port
    )
}

async fn discover_scopes_with_rmcp(server_url: &str) -> Result<Vec<String>, String> {
    let auth_manager = AuthorizationManager::new(server_url)
        .await
        .map_err(|e| e.to_string())?;

    let _ = auth_manager.discover_metadata().await;

    Ok(auth_manager.select_scopes(None, &[]))
}

async fn initialize_and_start_auth(
    server_url: &str,
    redirect_uri: &str,
    client_metadata_url: &str,
    scopes: &[String],
) -> Result<OAuthState, String> {
    let scope_refs: Vec<&str> = scopes.iter().map(|s| s.as_str()).collect();

    let mut state = OAuthState::new(server_url, None)
        .await
        .map_err(|e| format!("Failed to initialize OAuth: {}", e))?;

    state
        .start_authorization_with_metadata_url(
            &scope_refs,
            redirect_uri,
            Some("AgentOne"),
            Some(client_metadata_url),
        )
        .await
        .map_err(|e| {
            let err = e.to_string();
            if err.contains("Dynamic client registration not supported") {
                "This server's authorization provider does not support automatic client registration. Manual OAuth app setup may be required.".to_string()
            } else if err.contains("No authorization support detected") {
                "Could not discover OAuth configuration for this server.".to_string()
            } else {
                err
            }
        })?;

    Ok(state)
}

#[derive(Clone)]
struct AppState {
    code_receiver: Arc<Mutex<Option<oneshot::Sender<CallbackResult>>>>,
}

#[derive(Debug, Deserialize)]
struct CallbackParams {
    code: String,
    state: String,
}

#[derive(Debug, Deserialize)]
struct CallbackQuery {
    code: Option<String>,
    state: Option<String>,
    error: Option<String>,
    error_description: Option<String>,
}

#[derive(Debug)]
enum CallbackResult {
    Success(CallbackParams),
    Error {
        error: String,
        description: Option<String>,
    },
}

#[derive(Clone)]
pub struct KeyringCredentialStore {
    server_id: String,
    db_path: PathBuf,
}

impl KeyringCredentialStore {
    pub fn new(server_id: String, db_path: PathBuf) -> Self {
        Self { server_id, db_path }
    }

    fn key(&self) -> String {
        format!("mcp_auth_{}", self.server_id)
    }
}

#[async_trait::async_trait]
impl CredentialStore for KeyringCredentialStore {
    async fn load(&self) -> Result<Option<StoredCredentials>, AuthError> {
        match get_password(&self.key(), &self.db_path).await {
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

        set_password(&self.key(), &json, &self.db_path)
            .await
            .map_err(AuthError::InternalError)
    }

    async fn clear(&self) -> Result<(), AuthError> {
        delete_password(&self.key(), &self.db_path)
            .await
            .map(|_| ())
            .map_err(AuthError::InternalError)
    }
}

async fn callback_handler(
    Query(query): Query<CallbackQuery>,
    State(state): State<AppState>,
) -> Html<&'static str> {
    if let Some(sender) = state.code_receiver.lock().await.take() {
        let result = match (
            query.code,
            query.state,
            query.error,
            query.error_description,
        ) {
            (Some(code), Some(state), _, _) => {
                CallbackResult::Success(CallbackParams { code, state })
            }
            (_, _, Some(error), description) => CallbackResult::Error { error, description },
            _ => CallbackResult::Error {
                error: "invalid_callback".to_string(),
                description: Some("Missing OAuth callback parameters".to_string()),
            },
        };
        let _ = sender.send(result);
    }
    Html(include_str!("../static/mcp_oauth_callback.html"))
}

#[tauri::command]
pub async fn mcp_authenticate(
    app: tauri::AppHandle<tauri::Cef>,
    state: tauri::State<'_, AuthCancellationState>,
    server_id: String,
    server_url: String,
) -> Result<String, String> {
    let addr = SocketAddr::from(([127, 0, 0, 1], 0));
    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .map_err(|e| e.to_string())?;

    let port = listener.local_addr().map_err(|e| e.to_string())?.port();
    let redirect_uri = format!("http://127.0.0.1:{}/callback", port);
    let client_metadata_url = get_client_metadata_url(port);

    let (code_sender, code_receiver) = oneshot::channel::<CallbackResult>();
    let app_state = AppState {
        code_receiver: Arc::new(Mutex::new(Some(code_sender))),
    };

    let router = Router::new()
        .route("/callback", get(callback_handler))
        .with_state(app_state);

    let server_handle = tokio::spawn(async move { axum::serve(listener, router).await });

    let scopes = discover_scopes_with_rmcp(&server_url)
        .await
        .unwrap_or_default();

    let redirect_uri_clone = redirect_uri.clone();
    let client_metadata_clone = client_metadata_url.clone();
    let scopes_clone = scopes.clone();

    let mut oauth_state = initialize_and_start_auth(
        &server_url,
        &redirect_uri_clone,
        &client_metadata_clone,
        &scopes_clone,
    )
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

    let params_result = tokio::select! {
        res = tokio::time::timeout(Duration::from_secs(OAUTH_CALLBACK_TIMEOUT_SECS), code_receiver) => {
            match res {
                Ok(Ok(params)) => Ok(params),
                Ok(Err(_)) => Err("Authorization callback failed".to_string()),
                Err(_) => Err(format!("Authorization timed out after {} seconds", OAUTH_CALLBACK_TIMEOUT_SECS)),
            }
        },
        _ = cancel_rx => {
            Err("Authorization cancelled".to_string())
        }
    };

    {
        let mut map = state.0.lock().await;
        map.remove(&server_id);
    }

    server_handle.abort();

    let params = match params_result? {
        CallbackResult::Success(params) => params,
        CallbackResult::Error { error, description } => {
            let message = description.unwrap_or(error);
            return Err(format!("Authorization failed: {}", message));
        }
    };

    oauth_state
        .handle_callback(&params.code, &params.state)
        .await
        .map_err(|e| format!("Token exchange failed: {}", e))?;

    let (client_id, token_response) = oauth_state
        .get_credentials()
        .await
        .map_err(|e| e.to_string())?;

    let db_path = resolve_agent_db_path(&app)?;
    let cred_store = KeyringCredentialStore::new(server_id, db_path);
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);
    let creds: StoredCredentials = serde_json::from_value(serde_json::json!({
        "client_id": client_id,
        "token_response": token_response,
        "granted_scopes": [],
        "token_received_at": now,
    }))
    .map_err(|e| e.to_string())?;
    cred_store.save(creds).await.map_err(|e| e.to_string())?;

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
    }
    Ok(())
}

async fn try_get_token_with_url(
    server_id: &str,
    url: &str,
    db_path: PathBuf,
) -> Result<String, String> {
    let cred_store = KeyringCredentialStore::new(server_id.to_string(), db_path);

    let mut auth_manager = AuthorizationManager::new(url)
        .await
        .map_err(|e| e.to_string())?;

    auth_manager.set_credential_store(cred_store);

    let initialized = auth_manager
        .initialize_from_store()
        .await
        .map_err(|e| e.to_string())?;

    if initialized {
        auth_manager
            .get_access_token()
            .await
            .map_err(|e| e.to_string())
    } else {
        Err("No valid credentials found".to_string())
    }
}

#[tauri::command]
pub async fn mcp_check_oauth_support(server_url: String) -> Result<bool, String> {
    let supported = async {
        let auth_manager = AuthorizationManager::new(&server_url)
            .await
            .map_err(|e| e.to_string())?;

        auth_manager
            .discover_metadata()
            .await
            .map(|_| true)
            .map_err(|e| e.to_string())
    }
    .await;

    Ok(supported.is_ok())
}

#[tauri::command]
pub async fn mcp_logout(
    app: tauri::AppHandle<tauri::Cef>,
    server_id: String,
) -> Result<(), String> {
    let db_path = resolve_agent_db_path(&app)?;
    let cred_store = KeyringCredentialStore::new(server_id, db_path);
    cred_store.clear().await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn mcp_get_token(
    app: tauri::AppHandle<tauri::Cef>,
    server_id: String,
    server_url: String,
) -> Result<String, String> {
    let db_path = resolve_agent_db_path(&app)?;
    let cred_store = KeyringCredentialStore::new(server_id.clone(), db_path.clone());

    let loaded = cred_store.load().await.map_err(|e| e.to_string())?;
    if loaded.is_none() {
        return Err("No credentials found. Please login.".to_string());
    }

    try_get_token_with_url(&server_id, &server_url, db_path).await
}
