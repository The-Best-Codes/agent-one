use super::constants::{DEFAULT_TIMEOUT_SECONDS, MAX_CONTENT_LENGTH, MAX_TIMEOUT_SECONDS};
use crate::utils::headless_webview::fetch_url_with_webview;
use htmd::HtmlToMarkdown;
use once_cell::sync::Lazy;
use regex::Regex;
use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tokio::time::{timeout, Duration};
use wreq::Client;
use wreq_util::Emulation;

// TODO: Truncate long image data URLs

static BLANK_LINE_REGEX: Lazy<Regex> = Lazy::new(|| Regex::new(r"\n\s*\n\s*\n+").unwrap());
static TITLE_REGEX: Lazy<Regex> = Lazy::new(|| Regex::new(r"<title[^>]*>([^<]*)</title>").unwrap());

#[derive(Debug, Serialize, Deserialize)]
pub struct UrlContentResponse {
    pub content: String,
    pub title: Option<String>,
    pub url: String,
    pub format: String,
    pub length: usize,
    pub truncated: bool,
}

#[tauri::command]
pub async fn get_url_content(
    app: AppHandle,
    url: String,
    format: String,
    max_length: usize,
    timeout_seconds: Option<u64>,
    use_webview: Option<bool>,
) -> Result<UrlContentResponse, String> {
    let timeout_seconds = timeout_seconds
        .unwrap_or(DEFAULT_TIMEOUT_SECONDS)
        .min(MAX_TIMEOUT_SECONDS);

    let max_length = max_length.min(MAX_CONTENT_LENGTH);
    let use_webview = use_webview.unwrap_or(true);

    if use_webview {
        let webview_result = fetch_url_with_webview(app, url.clone(), timeout_seconds)
            .await
            .map_err(|e| format!("Failed to fetch URL with webview: {e}"))?;

        if !webview_result.success {
            return Err(format!(
                "Webview reported failure for URL: {}",
                webview_result.url
            ));
        }

        let html_content = webview_result.content.ok_or_else(|| {
            format!(
                "Webview reported success but returned no content for URL: {}",
                webview_result.url
            )
        })?;

        let processed_content = match format.as_str() {
            "markdown" => {
                let mut converter_builder = HtmlToMarkdown::builder();
                converter_builder =
                    converter_builder.skip_tags(vec!["script", "style", "link", "meta"]);
                let converter = converter_builder.build();

                let mut markdown_output = converter
                    .convert(&html_content)
                    .map_err(|e| format!("Failed to convert HTML to markdown: {e}"))?;

                markdown_output = BLANK_LINE_REGEX
                    .replace_all(&markdown_output, "\n\n")
                    .to_string();

                markdown_output
            }
            "raw" => html_content,
            _ => return Err("Invalid format. Use 'markdown' or 'raw'".to_string()),
        };

        let (mut final_content, truncated) = if processed_content.len() > max_length {
            let mut byte_idx = 0;
            for (idx, _) in processed_content.char_indices() {
                if idx >= max_length {
                    break;
                }
                byte_idx = idx;
            }

            if byte_idx == 0 && max_length > 0 && !processed_content.is_empty() {
                byte_idx = processed_content.chars().next().unwrap().len_utf8();
                if byte_idx > max_length {
                    byte_idx = max_length;
                }
            }

            (processed_content[..byte_idx].to_string(), true)
        } else {
            (processed_content, false)
        };

        if truncated {
            final_content =
                format!("{final_content}...\n\n[Content truncated at {max_length} bytes]");
        }

        return Ok(UrlContentResponse {
            content: final_content.clone(),
            title: webview_result.title,
            url: webview_result.url,
            format,
            length: final_content.len(),
            truncated,
        });
    }

    let emulation = Emulation::Chrome137;

    let client = Client::builder()
        .emulation(emulation)
        .cookie_store(true)
        .redirect(wreq::redirect::Policy::limited(10))
        .timeout(Duration::from_secs(timeout_seconds))
        .connect_timeout(Duration::from_secs(10))
        .build()
        .map_err(|e| format!("Failed to build wreq client: {}", e))?;

    let response = timeout(
        Duration::from_secs(timeout_seconds + 5),
        client.get(&url).send(),
    )
    .await
    .map_err(|_| "Request timed out".to_string())?
    .map_err(|e| format!("Request failed: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("HTTP error: {}", response.status()));
    }

    let final_url = response.url().to_string();

    let content_type = response
        .headers()
        .get("content-type")
        .and_then(|ct| ct.to_str().ok())
        .unwrap_or("")
        .to_lowercase();

    let text = response
        .text()
        .await
        .map_err(|e| format!("Failed to read response body: {}", e))?;

    let title = if content_type.contains("text/html") {
        extract_title(&text)
    } else {
        None
    };

    let processed_content = match format.as_str() {
        "markdown" => {
            if content_type.contains("text/html") {
                let mut converter_builder = HtmlToMarkdown::builder();
                converter_builder =
                    converter_builder.skip_tags(vec!["script", "style", "link", "meta"]);
                let converter = converter_builder.build();

                let mut markdown_output = converter
                    .convert(&text)
                    .map_err(|e| format!("Failed to convert HTML to markdown: {e}"))?;

                markdown_output = BLANK_LINE_REGEX
                    .replace_all(&markdown_output, "\n\n")
                    .to_string();

                markdown_output
            } else {
                text
            }
        }
        "raw" => text,
        _ => return Err("Invalid format. Use 'markdown' or 'raw'".to_string()),
    };

    let (mut final_content, truncated) = if processed_content.len() > max_length {
        let mut byte_idx = 0;
        for (idx, _) in processed_content.char_indices() {
            if idx >= max_length {
                break;
            }
            byte_idx = idx;
        }

        if byte_idx == 0 && max_length > 0 && !processed_content.is_empty() {
            byte_idx = processed_content.chars().next().unwrap().len_utf8();
            if byte_idx > max_length {
                byte_idx = max_length;
            }
        }

        (processed_content[..byte_idx].to_string(), true)
    } else {
        (processed_content, false)
    };

    if truncated {
        final_content = format!("{final_content}...\n\n[Content truncated at {max_length} bytes]");
    }

    Ok(UrlContentResponse {
        content: final_content.clone(),
        title,
        url: final_url,
        format,
        length: final_content.len(),
        truncated,
    })
}

fn extract_title(html: &str) -> Option<String> {
    TITLE_REGEX
        .captures(html)
        .and_then(|caps| caps.get(1))
        .map(|m| m.as_str().trim().to_string())
        .filter(|s| !s.is_empty())
}
