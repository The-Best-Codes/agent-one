#[cfg(not(any(target_os = "android", target_os = "ios")))]
pub mod headless_webview;

#[cfg(not(any(target_os = "android", target_os = "ios")))]
pub use headless_webview::*;
