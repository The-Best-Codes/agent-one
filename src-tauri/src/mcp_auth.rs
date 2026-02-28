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

fn get_client_metadata_url(port: u16) -> String {
    format!(
        "https://www.agent-one.dev/api/mcp-oauth/client-metadata.json?port={}",
        port
    )
}

#[derive(Debug, Deserialize)]
struct ProtectedResourceMetadata {
    scopes_supported: Option<Vec<String>>,
}

fn parse_www_authenticate_scopes(header: &str) -> Option<Vec<String>> {
    for part in header.split(',') {
        let part = part.trim();
        let lower = part.to_lowercase();
        if lower.starts_with("scope=") {
            let value = &part["scope=".len()..];
            return Some(
                value
                    .trim_matches('"')
                    .split_whitespace()
                    .map(|s| s.to_string())
                    .collect(),
            );
        }
    }
    None
}

fn parse_resource_metadata_url(header: &str) -> Option<String> {
    for part in header.split(',') {
        let part = part.trim();
        let lower = part.to_lowercase();
        if lower.starts_with("resource_metadata=") {
            let value = &part["resource_metadata=".len()..];
            return Some(value.trim_matches('"').to_string());
        }
    }
    None
}

async fn discover_scopes(server_url: &str) -> Vec<String> {
    let client = wreq::Client::new();

    let response = match client.get(server_url).send().await {
        Ok(r) => r,
        Err(_) => return vec!["mcp".to_string()],
    };

    if let Some(www_auth) = response.headers().get("www-authenticate") {
        if let Ok(header_str) = www_auth.to_str() {
            if let Some(scopes) = parse_www_authenticate_scopes(header_str) {
                if !scopes.is_empty() {
                    return scopes;
                }
            }

            if let Some(rm_url) = parse_resource_metadata_url(header_str) {
                if let Ok(rm_resp) = client.get(&rm_url).send().await {
                    if let Ok(prm) = rm_resp.json::<ProtectedResourceMetadata>().await {
                        if let Some(scopes) = prm.scopes_supported {
                            if !scopes.is_empty() {
                                return scopes;
                            }
                        }
                    }
                }
            }
        }
    }

    let parsed_url = match Url::parse(server_url) {
        Ok(u) => u,
        Err(_) => return vec!["mcp".to_string()],
    };

    let base = format!(
        "{}://{}{}",
        parsed_url.scheme(),
        parsed_url.host_str().unwrap_or(""),
        parsed_url
            .port()
            .map(|p| format!(":{}", p))
            .unwrap_or_default()
    );
    let path = parsed_url.path();

    let mut well_known_urls = Vec::new();
    if path != "/" && !path.is_empty() {
        let trimmed = path.trim_matches('/');
        well_known_urls.push(format!(
            "{}/.well-known/oauth-protected-resource/{}",
            base, trimmed
        ));
    }
    well_known_urls.push(format!("{}/.well-known/oauth-protected-resource", base));

    for url in well_known_urls {
        if let Ok(resp) = client.get(&url).send().await {
            if resp.status().is_success() {
                if let Ok(prm) = resp.json::<ProtectedResourceMetadata>().await {
                    if let Some(scopes) = prm.scopes_supported {
                        if !scopes.is_empty() {
                            return scopes;
                        }
                    }
                }
            }
        }
    }

    vec!["mcp".to_string()]
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

fn get_origin_url(url: &str) -> Option<String> {
    let parsed = Url::parse(url).ok()?;
    if parsed.path() == "/" || parsed.path().is_empty() {
        return None;
    }

    let mut origin = parsed.clone();
    origin.set_path("");
    origin.set_query(None);
    origin.set_fragment(None);

    let origin_str = origin.to_string();
    if origin_str.trim_end_matches('/') != url.trim_end_matches('/') {
        Some(origin_str)
    } else {
        None
    }
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
                match operation(origin_url).await {
                    Ok(result) => Ok(result),
                    Err(_) => Err(primary_err),
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
    let addr = SocketAddr::from(([127, 0, 0, 1], 0));
    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .map_err(|e| e.to_string())?;

    let port = listener.local_addr().map_err(|e| e.to_string())?.port();
    let redirect_uri = format!("http://127.0.0.1:{}/callback", port);
    let client_metadata_url = get_client_metadata_url(port);

    let (code_sender, code_receiver) = oneshot::channel::<CallbackParams>();
    let app_state = AppState {
        code_receiver: Arc::new(Mutex::new(Some(code_sender))),
    };

    let router = Router::new()
        .route("/callback", get(callback_handler))
        .with_state(app_state);

    let server_handle = tokio::spawn(async move { axum::serve(listener, router).await });

    let scopes = discover_scopes(&server_url).await;

    let redirect_uri_clone = redirect_uri.clone();
    let client_metadata_clone = client_metadata_url.clone();
    let scopes_clone = scopes.clone();

    let mut oauth_state = try_with_origin_fallback(&server_url, |url| {
        let redirect = redirect_uri_clone.clone();
        let metadata = client_metadata_clone.clone();
        let sc = scopes_clone.clone();
        async move { initialize_and_start_auth(&url, &redirect, &metadata, &sc).await }
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

    let params = params_result?;

    oauth_state
        .handle_callback(&params.code, &params.state)
        .await
        .map_err(|e| format!("Token exchange failed: {}", e))?;

    let (client_id, token_response) = oauth_state
        .get_credentials()
        .await
        .map_err(|e| e.to_string())?;

    let cred_store = KeyringCredentialStore::new(server_id);
    cred_store
        .save(StoredCredentials {
            client_id,
            token_response,
            granted_scopes: Vec::new(),
            token_received_at: Some(
                std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .map(|d| d.as_secs())
                    .unwrap_or(0),
            ),
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
    }
    Ok(())
}

async fn try_get_token_with_url(server_id: &str, url: &str) -> Result<String, String> {
    let cred_store = KeyringCredentialStore::new(server_id.to_string());

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
            .refresh_token()
            .await
            .map_err(|e| e.to_string())?;

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
    let client = wreq::Client::new();

    let response = match client.get(&server_url).send().await {
        Ok(r) => r,
        Err(_) => return Ok(false),
    };

    if response.headers().get("www-authenticate").is_some() {
        return Ok(true);
    }

    let parsed_url = match Url::parse(&server_url) {
        Ok(u) => u,
        Err(_) => return Ok(false),
    };

    let base = format!(
        "{}://{}{}",
        parsed_url.scheme(),
        parsed_url.host_str().unwrap_or(""),
        parsed_url
            .port()
            .map(|p| format!(":{}", p))
            .unwrap_or_default()
    );
    let path = parsed_url.path();

    let mut well_known_urls = Vec::new();
    if path != "/" && !path.is_empty() {
        let trimmed = path.trim_matches('/');
        well_known_urls.push(format!(
            "{}/.well-known/oauth-protected-resource/{}",
            base, trimmed
        ));
    }
    well_known_urls.push(format!("{}/.well-known/oauth-protected-resource", base));

    for url in &well_known_urls {
        if let Ok(resp) = client.get(url).send().await {
            if resp.status().is_success() {
                return Ok(true);
            }
        }
    }

    let mut auth_server_urls = Vec::new();
    if path != "/" && !path.is_empty() {
        let trimmed = path.trim_matches('/');
        auth_server_urls.push(format!(
            "{}/.well-known/oauth-authorization-server/{}",
            base, trimmed
        ));
    }
    auth_server_urls.push(format!("{}/.well-known/oauth-authorization-server", base));

    for url in &auth_server_urls {
        if let Ok(resp) = client.get(url).send().await {
            if resp.status().is_success() {
                return Ok(true);
            }
        }
    }

    Ok(false)
}

#[tauri::command]
pub async fn mcp_logout(server_id: String) -> Result<(), String> {
    let cred_store = KeyringCredentialStore::new(server_id);
    cred_store.clear().await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn mcp_get_token(server_id: String, server_url: String) -> Result<String, String> {
    let cred_store = KeyringCredentialStore::new(server_id.clone());

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
