use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};
use tokio::sync::{oneshot, Mutex};
use tokio::time::{sleep, timeout, Duration};

type WebviewTimeoutHandleMap = Arc<Mutex<HashMap<String, tokio::task::JoinHandle<()>>>>;
type WebviewChannelMap = Arc<Mutex<HashMap<String, oneshot::Sender<String>>>>;

static WEBVIEW_TIMEOUTS: once_cell::sync::Lazy<WebviewTimeoutHandleMap> =
    once_cell::sync::Lazy::new(|| Arc::new(Mutex::new(HashMap::new())));

static WEBVIEW_CHANNELS: once_cell::sync::Lazy<WebviewChannelMap> =
    once_cell::sync::Lazy::new(|| Arc::new(Mutex::new(HashMap::new())));

#[derive(Debug, Serialize, Deserialize)]
pub struct WebviewFetchResult {
    pub success: bool,
    pub content: Option<String>,
    pub error: Option<String>,
    pub url: String,
    pub title: Option<String>,
}

fn generate_webview_id() -> String {
    use rand::Rng;
    let id: u64 = rand::rng().random();
    format!("webview-{}", id)
}

#[tauri::command]
pub async fn webview_html_callback(webview_id: String, html: String) -> Result<(), String> {
    let mut channels = WEBVIEW_CHANNELS.lock().await;
    if let Some(sender) = channels.remove(&webview_id) {
        let _ = sender.send(html);
    }
    Ok(())
}

pub async fn create_fetch_webview(
    app: AppHandle,
    url: String,
    timeout_seconds: u64,
) -> Result<String, String> {
    let webview_id = generate_webview_id();

    let parsed_url = WebviewUrl::External(url.parse().map_err(|e| format!("Invalid URL: {}", e))?);

    let _webview_window = WebviewWindowBuilder::new(&app, &webview_id, parsed_url)
        .title("URL Fetch Webview")
        .inner_size(1200.0, 800.0)
        .position(0.0, 0.0)
        .resizable(false)
        .visible(true)
        .closable(false)
        .skip_taskbar(true)
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        .build()
        .map_err(|e| format!("Failed to create webview: {}", e))?;

    let cleanup_app = app.clone();
    let cleanup_id = webview_id.clone();
    let timeout_handle = tokio::spawn(async move {
        sleep(Duration::from_secs(timeout_seconds + 10)).await;
        if let Some(webview) = cleanup_app.get_webview_window(&cleanup_id) {
            let _ = webview.close();
        }
        let mut timeouts = WEBVIEW_TIMEOUTS.lock().await;
        timeouts.remove(&cleanup_id);
        let mut channels = WEBVIEW_CHANNELS.lock().await;
        channels.remove(&cleanup_id);
    });

    {
        let mut timeouts = WEBVIEW_TIMEOUTS.lock().await;
        timeouts.insert(webview_id.clone(), timeout_handle);
    }

    Ok(webview_id)
}

pub async fn fetch_html_from_webview(
    app: AppHandle,
    webview_id: String,
    timeout_seconds: u64,
) -> Result<String, String> {
    let webview = app
        .get_webview_window(&webview_id)
        .ok_or_else(|| format!("Webview '{}' not found", webview_id))?;

    sleep(Duration::from_millis(3000)).await;

    let (sender, receiver) = oneshot::channel::<String>();

    {
        let mut channels = WEBVIEW_CHANNELS.lock().await;
        channels.insert(webview_id.clone(), sender);
    }

    let js_code = format!(
        r#"
        (function() {{
            try {{
                // Wait a bit more for dynamic content to load
                setTimeout(function() {{
                    const html = document.documentElement.outerHTML;
                    window.__TAURI__.core.invoke('webview_html_callback', {{
                        webviewId: '{}',
                        html: html
                    }}).catch(console.error);
                }}, 1000);
            }} catch (error) {{
                window.__TAURI__.core.invoke('webview_html_callback', {{
                    webviewId: '{}',
                    html: 'Error: ' + error.message
                }}).catch(console.error);
            }}
        }})();
    "#,
        webview_id, webview_id
    );

    webview
        .eval(&js_code)
        .map_err(|e| format!("Failed to execute JavaScript: {}", e))?;

    let result = timeout(Duration::from_secs(timeout_seconds), receiver)
        .await
        .map_err(|_| "Timeout waiting for HTML content".to_string())?
        .map_err(|_| "Failed to receive HTML content".to_string())?;

    Ok(result)
}

pub async fn close_webview(app: AppHandle, webview_id: String) -> Result<(), String> {
    {
        let mut timeouts = WEBVIEW_TIMEOUTS.lock().await;
        if let Some(handle) = timeouts.remove(&webview_id) {
            handle.abort();
        }
    }

    {
        let mut channels = WEBVIEW_CHANNELS.lock().await;
        channels.remove(&webview_id);
    }

    if let Some(webview) = app.get_webview_window(&webview_id) {
        webview.close().map_err(|e| e.to_string())?;
    }

    Ok(())
}

pub async fn fetch_url_with_webview(
    app: AppHandle,
    url: String,
    timeout_seconds: u64,
) -> Result<WebviewFetchResult, String> {
    let webview_id = match create_fetch_webview(app.clone(), url.clone(), timeout_seconds).await {
        Ok(id) => id,
        Err(e) => {
            return Ok(WebviewFetchResult {
                success: false,
                content: None,
                error: Some(e),
                url,
                title: None,
            })
        }
    };

    let content_result =
        fetch_html_from_webview(app.clone(), webview_id.clone(), timeout_seconds).await;

    let _ = close_webview(app, webview_id).await;

    match content_result {
        Ok(content) => {
            let title = extract_title(&content);

            Ok(WebviewFetchResult {
                success: true,
                content: Some(content),
                error: None,
                url,
                title,
            })
        }
        Err(error) => Ok(WebviewFetchResult {
            success: false,
            content: None,
            error: Some(error),
            url,
            title: None,
        }),
    }
}

fn extract_title(html: &str) -> Option<String> {
    use once_cell::sync::Lazy;
    use regex::Regex;

    static TITLE_REGEX: Lazy<Regex> =
        Lazy::new(|| Regex::new(r"<title[^>]*>([^<]*)</title>").unwrap());

    TITLE_REGEX
        .captures(html)
        .and_then(|caps| caps.get(1))
        .map(|m| m.as_str().trim().to_string())
        .filter(|s| !s.is_empty())
}

#[tauri::command]
pub fn list_webviews(app: AppHandle) -> Result<Vec<String>, String> {
    let webviews = app.webview_windows();
    let labels: Vec<String> = webviews.keys().cloned().collect();
    Ok(labels)
}

#[tauri::command]
pub async fn force_close_webview(app: AppHandle, webview_id: String) -> Result<String, String> {
    close_webview(app, webview_id.clone()).await?;
    Ok(format!("Webview '{}' closed successfully", webview_id))
}
