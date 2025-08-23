use super::utils::{DEFAULT_TIMEOUT_SECONDS, MAX_CONTENT_LENGTH, MAX_TIMEOUT_SECONDS};
use once_cell::sync::Lazy;
use regex::Regex;
use serde::{Deserialize, Serialize};
use tokio::time::{timeout, Duration};
use wreq::Client;
use wreq_util::Emulation;

static HTML_TITLE_REGEX: Lazy<Regex> =
    Lazy::new(|| Regex::new(r"<title[^>]*>([^<]*)</title>").unwrap());

static HTML_TAG_REGEX: Lazy<Regex> = Lazy::new(|| Regex::new(r"<[^>]*>").unwrap());

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
    url: String,
    format: String,
    max_length: usize,
    timeout_seconds: Option<u64>,
) -> Result<UrlContentResponse, String> {
    let timeout_seconds = timeout_seconds
        .unwrap_or(DEFAULT_TIMEOUT_SECONDS)
        .min(MAX_TIMEOUT_SECONDS);

    let max_length = max_length.min(MAX_CONTENT_LENGTH);

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

    let text = response
        .text()
        .await
        .map_err(|e| format!("Failed to read response body: {}", e))?;

    let title = extract_title(&text);

    let (processed_content, truncated) = match format.as_str() {
        "markdown" => {
            let markdown = html_to_markdown(&text);
            truncate_content(&markdown, max_length)
        }
        "raw" => truncate_content(&text, max_length),
        _ => return Err("Invalid format. Use 'markdown' or 'raw'".to_string()),
    };

    Ok(UrlContentResponse {
        content: processed_content.clone(),
        title,
        url: final_url,
        format,
        length: processed_content.len(),
        truncated,
    })
}

fn extract_title(html: &str) -> Option<String> {
    HTML_TITLE_REGEX
        .captures(html)
        .and_then(|caps| caps.get(1))
        .map(|m| html_escape::decode_html_entities(m.as_str().trim()).to_string())
        .filter(|title| !title.is_empty())
}

fn html_to_markdown(html: &str) -> String {
    match htmd::convert(html) {
        Ok(markdown) => markdown,
        Err(_) => {
            let text = HTML_TAG_REGEX.replace_all(html, " ");
            let text = text.replace('\n', " ");
            let text = text.replace('\t', " ");

            let mut result = String::new();
            let mut prev_space = false;

            for ch in text.chars() {
                if ch.is_whitespace() {
                    if !prev_space {
                        result.push(' ');
                        prev_space = true;
                    }
                } else {
                    result.push(ch);
                    prev_space = false;
                }
            }

            result.trim().to_string()
        }
    }
}

fn truncate_content(content: &str, max_length: usize) -> (String, bool) {
    if content.len() <= max_length {
        (content.to_string(), false)
    } else {
        let truncated = if let Some(pos) = content[..max_length].rfind(' ') {
            &content[..pos]
        } else {
            &content[..max_length]
        };

        (format!("{}...", truncated), true)
    }
}
