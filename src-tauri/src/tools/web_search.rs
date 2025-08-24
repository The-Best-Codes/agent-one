use super::constants::{DEFAULT_TIMEOUT_SECONDS, MAX_TIMEOUT_SECONDS};
use crate::utils::headless_webview::fetch_url_with_webview;
use regex::Regex;
use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tokio::time::{timeout, Duration};
use wreq::Client;
use wreq_util::Emulation;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResult {
    pub title: String,
    pub url: String,
    pub snippet: String,
    pub display_url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WebSearchResponse {
    pub query: String,
    pub results: Vec<SearchResult>,
    pub total_results: usize,
    pub search_url: String,
}

#[tauri::command]
pub async fn web_search(
    app: AppHandle,
    query: String,
    max_results: Option<usize>,
    timeout_seconds: Option<u64>,
    use_webview: Option<bool>,
) -> Result<WebSearchResponse, String> {
    let timeout_seconds = timeout_seconds
        .unwrap_or(DEFAULT_TIMEOUT_SECONDS)
        .min(MAX_TIMEOUT_SECONDS);

    let max_results = max_results.unwrap_or(10).min(20); // Limit to 20 results max
    let use_webview = use_webview.unwrap_or(true); // Default to webview

    let search_url = format!(
        "https://html.duckduckgo.com/html/?q={}",
        urlencoding::encode(&query)
    );

    let html = if use_webview {
        // Use webview to avoid bot detection
        let webview_result = fetch_url_with_webview(app, search_url.clone(), timeout_seconds)
            .await
            .map_err(|e| format!("Failed to fetch search results with webview: {}", e))?;

        if !webview_result.success {
            return Err(format!(
                "Webview reported failure for search URL: {}",
                webview_result.url
            ));
        }

        webview_result.content.ok_or_else(|| {
            format!(
                "Webview reported success but returned no content for search URL: {}",
                webview_result.url
            )
        })?
    } else {
        // Fallback to HTTP client (may be detected as bot)
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
            client.get(&search_url).send(),
        )
        .await
        .map_err(|_| "Request timed out".to_string())?
        .map_err(|e| format!("Request failed: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("HTTP error: {}", response.status()));
        }

        response
            .text()
            .await
            .map_err(|e| format!("Failed to read response body: {}", e))?
    };

    let results = parse_search_results(&html, max_results)?;

    Ok(WebSearchResponse {
        query,
        total_results: results.len(),
        results,
        search_url,
    })
}

fn parse_search_results(html: &str, max_results: usize) -> Result<Vec<SearchResult>, String> {
    println!("HTML: {}", html);
    let mut results = Vec::new();

    // Compile all regexes outside the loop
    let result_regex = Regex::new(r#"<div[^>]*class="[^"]*result[^"]*results_links[^"]*web-result[^"]*"[^>]*>(.*?)</div>\s*</div>\s*(?:</div>)?"#)
        .map_err(|e| format!("Failed to compile result regex: {}", e))?;

    let title_regex = Regex::new(r#"<h2[^>]*class="[^"]*result__title[^"]*"[^>]*>.*?<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]*)"[^>]*>(.*?)</a>"#)
        .map_err(|e| format!("Failed to compile title regex: {}", e))?;

    let display_url_regex = Regex::new(r#"<a[^>]*class="[^"]*result__url[^"]*"[^>]*>([^<]*)</a>"#)
        .map_err(|e| format!("Failed to compile display URL regex: {}", e))?;

    let snippet_regex = Regex::new(r#"<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>(.*?)</a>"#)
        .map_err(|e| format!("Failed to compile snippet regex: {}", e))?;

    for result_match in result_regex.find_iter(html) {
        if results.len() >= max_results {
            break;
        }

        let result_html = result_match.as_str();

        // Extract title and main URL

        let (title, url) = if let Some(title_match) = title_regex.captures(result_html) {
            let raw_url = title_match.get(1).unwrap().as_str();
            let raw_title = title_match.get(2).unwrap().as_str();

            // Clean up the URL (DuckDuckGo wraps URLs)
            let clean_url = extract_actual_url(raw_url);
            let clean_title = clean_html_text(raw_title);

            (clean_title, clean_url)
        } else {
            continue; // Skip if we can't find title/URL
        };

        // Extract display URL
        let display_url = if let Some(display_match) = display_url_regex.captures(result_html) {
            clean_html_text(display_match.get(1).unwrap().as_str())
        } else {
            url.clone() // Fallback to main URL
        };

        // Extract snippet
        let snippet = if let Some(snippet_match) = snippet_regex.captures(result_html) {
            clean_html_text(snippet_match.get(1).unwrap().as_str())
        } else {
            String::new() // Empty snippet if not found
        };

        // Skip ads and invalid results
        if url.contains("duckduckgo.com/y.js") || url.contains("ad_domain") || title.is_empty() {
            continue;
        }

        results.push(SearchResult {
            title,
            url,
            snippet,
            display_url,
        });
    }

    Ok(results)
}

fn extract_actual_url(ddg_url: &str) -> String {
    // DuckDuckGo wraps URLs like: //duckduckgo.com/l/?uddg=https%3A%2F%2Fwww.example.com
    if let Some(uddg_start) = ddg_url.find("uddg=") {
        let encoded_url = &ddg_url[uddg_start + 5..];
        if let Some(end) = encoded_url.find('&') {
            let encoded_url = &encoded_url[..end];
            if let Ok(decoded) = urlencoding::decode(encoded_url) {
                return decoded.to_string();
            }
        } else if let Ok(decoded) = urlencoding::decode(encoded_url) {
            return decoded.to_string();
        }
    }

    // If extraction fails, return the original URL
    ddg_url.to_string()
}

fn clean_html_text(text: &str) -> String {
    // Remove HTML tags and decode entities
    let tag_regex = Regex::new(r"<[^>]*>").unwrap();
    let no_tags = tag_regex.replace_all(text, "");

    // Decode common HTML entities
    let mut result = no_tags.to_string();
    result = result.replace("&amp;", "&");
    result = result.replace("&lt;", "<");
    result = result.replace("&gt;", ">");
    result = result.replace("&quot;", "\"");
    result = result.replace("&#39;", "'");
    result = result.replace("&nbsp;", " ");
    result = result.replace("&#92;", "\\");

    // Clean up whitespace
    let whitespace_regex = Regex::new(r"\s+").unwrap();
    whitespace_regex
        .replace_all(&result, " ")
        .trim()
        .to_string()
}
