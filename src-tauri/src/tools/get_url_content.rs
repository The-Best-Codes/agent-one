use super::utils::{DEFAULT_TIMEOUT_SECONDS, MAX_CONTENT_LENGTH, MAX_TIMEOUT_SECONDS};
use once_cell::sync::Lazy;
use rand::{rng, seq::IndexedRandom};
use regex::Regex;
use reqwest::header::{
    HeaderMap, HeaderValue, ACCEPT, ACCEPT_ENCODING, ACCEPT_LANGUAGE, USER_AGENT,
};
use serde::{Deserialize, Serialize};
use tokio::time::{timeout, Duration};

const USER_AGENTS: &[&str] = &[
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Firefox/121.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Firefox/121.0",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1.2 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (iPad; CPU OS 17_1_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1.2 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
];

static STYLE_REGEX: Lazy<Regex> =
    Lazy::new(|| Regex::new(r"(?is)<style[^>]*>.*?</style>").unwrap());
static SCRIPT_REGEX: Lazy<Regex> =
    Lazy::new(|| Regex::new(r"(?is)<script[^>]*>.*?</script>").unwrap());
static COMMENT_REGEX: Lazy<Regex> = Lazy::new(|| Regex::new(r"(?is)<!--.*?-->").unwrap());
static LINK_REGEX: Lazy<Regex> = Lazy::new(|| Regex::new(r"(?is)<link[^>]*>").unwrap());
static META_REGEX: Lazy<Regex> = Lazy::new(|| Regex::new(r"(?is)<meta[^>]*>").unwrap());
static BLANK_LINE_REGEX: Lazy<Regex> = Lazy::new(|| Regex::new(r"\n\s*\n\s*\n+").unwrap());
static TITLE_REGEX: Lazy<Regex> = Lazy::new(|| Regex::new(r"<title[^>]*>([^<]*)</title>").unwrap());

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
    if max_length > MAX_CONTENT_LENGTH {
        return Err(format!("max_length cannot exceed {MAX_CONTENT_LENGTH}"));
    }

    let timeout_duration = Duration::from_secs(
        timeout_seconds
            .unwrap_or(DEFAULT_TIMEOUT_SECONDS)
            .min(MAX_TIMEOUT_SECONDS),
    );

    timeout(timeout_duration, fetch_url_content(url, format, max_length))
        .await
        .map_err(|_| "Request timed out".to_string())?
}

async fn fetch_url_content(
    url: String,
    format: String,
    max_length: usize,
) -> Result<UrlContentResponse, String> {
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(MAX_TIMEOUT_SECONDS))
        .gzip(true)
        .brotli(true)
        .deflate(true)
        .redirect(reqwest::redirect::Policy::limited(10))
        .tcp_keepalive(Duration::from_secs(60))
        .pool_idle_timeout(Duration::from_secs(90))
        .pool_max_idle_per_host(10)
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {e}"))?;

    let mut headers = HeaderMap::new();

    let user_agent = USER_AGENTS
        .choose(&mut rng())
        .expect("USER_AGENTS array should not be empty");
    headers.insert(
        USER_AGENT,
        HeaderValue::from_str(user_agent).map_err(|e| e.to_string())?,
    );

    headers.insert(
        ACCEPT,
        HeaderValue::from_static("text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8")
    );

    headers.insert(
        ACCEPT_ENCODING,
        HeaderValue::from_static("gzip, deflate, br"),
    );

    headers.insert(ACCEPT_LANGUAGE, HeaderValue::from_static("en-US,en;q=0.9"));

    let response = client
        .get(&url)
        .headers(headers)
        .send()
        .await
        .map_err(|e| format!("Failed to fetch URL: {e}"))?;

    if !response.status().is_success() {
        return Err(format!("HTTP error: {}", response.status()));
    }

    let content_type = response
        .headers()
        .get("content-type")
        .and_then(|ct| ct.to_str().ok())
        .unwrap_or("")
        .to_lowercase();

    let mut raw_content = response
        .text()
        .await
        .map_err(|e| format!("Failed to read response body: {e}"))?;

    let title = if content_type.contains("text/html") {
        extract_title(&raw_content)
    } else {
        None
    };

    let processed_content = match format.as_str() {
        "markdown" => {
            if content_type.contains("text/html") {
                // TODO: Add option to tool to remove long data URLs, data images, etc.
                raw_content = STYLE_REGEX.replace_all(&raw_content, "").to_string();
                raw_content = SCRIPT_REGEX.replace_all(&raw_content, "").to_string();
                raw_content = COMMENT_REGEX.replace_all(&raw_content, "").to_string();
                raw_content = LINK_REGEX.replace_all(&raw_content, "").to_string();
                raw_content = META_REGEX.replace_all(&raw_content, "").to_string();
                raw_content = BLANK_LINE_REGEX
                    .replace_all(&raw_content, "\n\n")
                    .to_string();

                htmd::convert(&raw_content)
                    .map_err(|e| format!("Failed to convert HTML to markdown: {e}"))?
            } else {
                // If not HTML, treat raw text as markdown (don't convert)
                raw_content
            }
        }
        "raw" => raw_content,
        _ => return Err("Invalid format. Use 'markdown' or 'raw'".to_string()),
    };

    // Truncate content if its byte length exceeds max_length, safely handling UTF-8
    let (mut final_content, truncated) = if processed_content.len() > max_length {
        // Find the byte index up to which characters can be safely included
        let mut byte_idx = 0;
        for (idx, _) in processed_content.char_indices() {
            if idx >= max_length {
                break;
            }
            byte_idx = idx;
        }
        // If the first character alone exceeds max_length, ensure at least that much is taken if max_length > 0
        if byte_idx == 0 && max_length > 0 && !processed_content.is_empty() {
            byte_idx = processed_content.chars().next().unwrap().len_utf8();
            if byte_idx > max_length {
                // If even the first char is too long, truncate it
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
        url,
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
