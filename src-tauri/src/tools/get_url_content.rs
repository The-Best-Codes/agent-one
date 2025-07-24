use super::utils::{DEFAULT_TIMEOUT_SECONDS, MAX_CONTENT_LENGTH, MAX_TIMEOUT_SECONDS};
use serde::{Deserialize, Serialize};
use tokio::time::{timeout, Duration};

#[derive(Serialize, Deserialize)]
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
    // Validate inputs
    if max_length > MAX_CONTENT_LENGTH {
        return Err(format!("max_length cannot exceed {}", MAX_CONTENT_LENGTH));
    }

    let timeout_duration = Duration::from_secs(
        timeout_seconds
            .unwrap_or(DEFAULT_TIMEOUT_SECONDS)
            .min(MAX_TIMEOUT_SECONDS),
    );

    // Perform the actual fetch with timeout
    timeout(timeout_duration, fetch_url_content(url, format, max_length))
        .await
        .map_err(|_| "Request timed out".to_string())?
}

async fn fetch_url_content(
    url: String,
    format: String,
    max_length: usize,
) -> Result<UrlContentResponse, String> {
    // Create HTTP client
    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (compatible; AgentOne/1.0)")
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    // Fetch the URL
    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Failed to fetch URL: {}", e))?;

    // Check if response is successful
    if !response.status().is_success() {
        return Err(format!("HTTP error: {}", response.status()));
    }

    // Get content type
    let content_type = response
        .headers()
        .get("content-type")
        .and_then(|ct| ct.to_str().ok())
        .unwrap_or("")
        .to_lowercase();

    // Get the response text
    let html_content = response
        .text()
        .await
        .map_err(|e| format!("Failed to read response body: {}", e))?;

    // Extract title if it's HTML
    let title = if content_type.contains("text/html") {
        extract_title(&html_content)
    } else {
        None
    };

    // Convert content based on format
    let processed_content = match format.as_str() {
        "markdown" => {
            if content_type.contains("text/html") {
                html2md::parse_html(&html_content)
            } else {
                html_content
            }
        }
        "raw" => html_content,
        _ => return Err("Invalid format. Use 'markdown' or 'raw'".to_string()),
    };

    // Truncate if necessary
    let (final_content, truncated) = if processed_content.len() > max_length {
        (
            format!(
                "{}...\n\n[Content truncated at {} characters]",
                &processed_content[..max_length],
                max_length
            ),
            true,
        )
    } else {
        (processed_content, false)
    };

    Ok(UrlContentResponse {
        content: final_content.clone(),
        title,
        url,
        format,
        length: final_content.len(),
        truncated,
    })
}

fn extract_title(html: &str) -> Option<String> {
    // Simple regex-based title extraction
    let title_regex = regex::Regex::new(r"<title[^>]*>([^<]*)</title>").ok()?;
    title_regex
        .captures(html)
        .and_then(|caps| caps.get(1))
        .map(|m| m.as_str().trim().to_string())
        .filter(|s| !s.is_empty())
}
