use super::constants::{DEFAULT_TIMEOUT_SECONDS, MAX_TIMEOUT_SECONDS};

#[cfg(not(any(target_os = "android", target_os = "ios")))]
use crate::utils::headless_webview::fetch_url_with_webview;

use regex::Regex;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::{AppHandle, Cef};
use tokio::sync::Semaphore;
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
    app: AppHandle<Cef>,
    query: String,
    max_results: Option<usize>,
    timeout_seconds: Option<u64>,
    use_webview: Option<bool>,
    max_pages: Option<usize>,
) -> Result<WebSearchResponse, String> {
    let timeout_seconds = timeout_seconds
        .unwrap_or(DEFAULT_TIMEOUT_SECONDS)
        .min(MAX_TIMEOUT_SECONDS);

    let max_results = max_results.unwrap_or(100).min(200);
    let use_webview = use_webview.unwrap_or(true);
    let max_pages = max_pages.unwrap_or(5).clamp(1, 20);

    let search_url = format!(
        "https://html.duckduckgo.com/html/?q={}",
        urlencoding::encode(&query)
    );

    let max_concurrent = std::thread::available_parallelism()
        .map(|p| p.get())
        .unwrap_or(1);

    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    {
        if use_webview {
            let first_page_result =
                fetch_url_with_webview(app.clone(), search_url.clone(), timeout_seconds)
                    .await
                    .map_err(|e| format!("Failed to fetch search results with webview: {}", e))?;

            if !first_page_result.success {
                return Err(format!(
                    "Webview reported failure for search URL: {}",
                    first_page_result.url
                ));
            }

            let first_html = first_page_result.content.ok_or_else(|| {
                format!(
                    "Webview reported success but returned no content for search URL: {}",
                    first_page_result.url
                )
            })?;

            let mut all_results = parse_search_results(&first_html, max_results)?;

            if max_pages > 1 && all_results.len() < max_results {
                if let Some(vqd) = extract_vqd(&first_html) {
                    let semaphore = Arc::new(Semaphore::new(max_concurrent));
                    let mut page_urls = Vec::new();
                    let mut offset = all_results.len();

                    for _ in 1..max_pages {
                        if offset >= max_results {
                            break;
                        }

                        let page_url = format!(
                            "https://html.duckduckgo.com/html/?q={}&s={}&dc={}&v=l&o=json&api=/d.js&vqd={}",
                            urlencoding::encode(&query),
                            offset,
                            offset + 1,
                            urlencoding::encode(&vqd)
                        );
                        page_urls.push((page_url, offset));
                        offset += 10;
                    }

                    let mut handles = Vec::new();

                    for (page_url, _) in page_urls {
                        let semaphore = Arc::clone(&semaphore);
                        let app_clone = app.clone();
                        let url_clone = page_url.clone();

                        let handle = tokio::spawn(async move {
                            let _permit = semaphore.acquire().await.unwrap();
                            fetch_url_with_webview(app_clone, url_clone, timeout_seconds).await
                        });

                        handles.push(handle);
                    }

                    for handle in handles {
                        if all_results.len() >= max_results {
                            break;
                        }

                        if let Ok(Ok(result)) = handle.await {
                            if result.success {
                                if let Some(html) = result.content {
                                    let remaining = max_results - all_results.len();
                                    let page_results = parse_search_results(&html, remaining)?;
                                    all_results.extend(page_results);
                                }
                            }
                        }
                    }
                }
            }

            all_results.truncate(max_results);

            return Ok(WebSearchResponse {
                query,
                total_results: all_results.len(),
                results: all_results,
                search_url,
            });
        }
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

    let first_response = timeout(
        Duration::from_secs(timeout_seconds + 5),
        client.get(&search_url).send(),
    )
    .await
    .map_err(|_| "Request timed out".to_string())?
    .map_err(|e| format!("Request failed: {}", e))?;

    if !first_response.status().is_success() {
        return Err(format!("HTTP error: {}", first_response.status()));
    }

    let first_html = first_response
        .text()
        .await
        .map_err(|e| format!("Failed to read response body: {}", e))?;

    let mut all_results = parse_search_results(&first_html, max_results)?;

    if max_pages > 1 && all_results.len() < max_results {
        if let Some(vqd) = extract_vqd(&first_html) {
            let semaphore = Arc::new(Semaphore::new(max_concurrent));
            let client = Arc::new(client);
            let mut page_urls = Vec::new();
            let mut offset = all_results.len();

            for _ in 1..max_pages {
                if offset >= max_results {
                    break;
                }

                let page_url = format!(
                    "https://html.duckduckgo.com/html/?q={}&s={}&dc={}&v=l&o=json&api=/d.js&vqd={}",
                    urlencoding::encode(&query),
                    offset,
                    offset + 1,
                    urlencoding::encode(&vqd)
                );
                page_urls.push((page_url, offset));
                offset += 10;
            }

            let mut handles = Vec::new();

            for (page_url, _) in page_urls {
                let semaphore = Arc::clone(&semaphore);
                let client = Arc::clone(&client);
                let url_clone = page_url.clone();

                let handle = tokio::spawn(async move {
                    let _permit = semaphore.acquire().await.unwrap();

                    let response = timeout(
                        Duration::from_secs(timeout_seconds + 5),
                        client.get(&url_clone).send(),
                    )
                    .await;

                    match response {
                        Ok(Ok(resp)) if resp.status().is_success() => resp.text().await.ok(),
                        _ => None,
                    }
                });

                handles.push(handle);
            }

            for handle in handles {
                if all_results.len() >= max_results {
                    break;
                }

                if let Ok(Some(html)) = handle.await {
                    let remaining = max_results - all_results.len();
                    let page_results = parse_search_results(&html, remaining)?;
                    all_results.extend(page_results);
                }
            }
        }
    }

    all_results.truncate(max_results);

    Ok(WebSearchResponse {
        query,
        total_results: all_results.len(),
        results: all_results,
        search_url,
    })
}

fn extract_vqd(html: &str) -> Option<String> {
    let vqd_regex = Regex::new(r#"<input[^>]*name="vqd"[^>]*value="([^"]+)"[^>]*/?\s*>"#).ok()?;

    if let Some(captures) = vqd_regex.captures(html) {
        return Some(captures.get(1)?.as_str().to_string());
    }

    let vqd_regex_alt =
        Regex::new(r#"<input[^>]*value="([^"]+)"[^>]*name="vqd"[^>]*/?\s*>"#).ok()?;

    if let Some(captures) = vqd_regex_alt.captures(html) {
        return Some(captures.get(1)?.as_str().to_string());
    }

    None
}

fn parse_search_results(html: &str, max_results: usize) -> Result<Vec<SearchResult>, String> {
    let mut results = Vec::new();

    let result_regex = Regex::new(r#"(?s)<div[^>]*class="[^"]*result[^"]*results_links[^"]*web-result[^"]*"[^>]*>(.*?)</div>\s*</div>"#)
        .map_err(|e| format!("Failed to compile result regex: {}", e))?;

    let title_regex = Regex::new(r#"(?s)<h2[^>]*class="[^"]*result__title[^"]*"[^>]*>.*?<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]*)"[^>]*>(.*?)</a>"#)
        .map_err(|e| format!("Failed to compile title regex: {}", e))?;

    let display_url_regex = Regex::new(r#"<a[^>]*class="[^"]*result__url[^"]*"[^>]*>([^<]*)</a>"#)
        .map_err(|e| format!("Failed to compile display URL regex: {}", e))?;

    let snippet_regex =
        Regex::new(r#"(?s)<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>(.*?)</a>"#)
            .map_err(|e| format!("Failed to compile snippet regex: {}", e))?;

    for result_match in result_regex.captures_iter(html) {
        if results.len() >= max_results {
            break;
        }

        let result_html = result_match.get(1).unwrap().as_str();

        let (title, url) = if let Some(title_match) = title_regex.captures(result_html) {
            let raw_url = title_match.get(1).unwrap().as_str();
            let raw_title = title_match.get(2).unwrap().as_str();

            let clean_url = extract_actual_url(raw_url);
            let clean_title = clean_html_text(raw_title);

            (clean_title, clean_url)
        } else {
            continue;
        };

        let display_url = if let Some(display_match) = display_url_regex.captures(result_html) {
            clean_html_text(display_match.get(1).unwrap().as_str())
        } else {
            url.clone()
        };

        let snippet = if let Some(snippet_match) = snippet_regex.captures(result_html) {
            clean_html_text(snippet_match.get(1).unwrap().as_str())
        } else {
            String::new()
        };

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

    ddg_url.to_string()
}

fn clean_html_text(text: &str) -> String {
    let tag_regex = Regex::new(r"<[^>]*>").unwrap();
    let no_tags = tag_regex.replace_all(text, "");

    let mut result = no_tags.to_string();
    result = result.replace("&amp;", "&");
    result = result.replace("&lt;", "<");
    result = result.replace("&gt;", ">");
    result = result.replace("&quot;", "\"");
    result = result.replace("&#39;", "'");
    result = result.replace("&nbsp;", " ");
    result = result.replace("&#92;", "\\");

    let whitespace_regex = Regex::new(r"\s+").unwrap();
    whitespace_regex
        .replace_all(&result, " ")
        .trim()
        .to_string()
}
