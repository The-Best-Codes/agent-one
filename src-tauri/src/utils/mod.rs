#[cfg(not(any(target_os = "android", target_os = "ios")))]
pub mod headless_webview;

#[cfg(not(any(target_os = "android", target_os = "ios")))]
pub mod cron;

pub mod project_files;
pub mod update_management;

#[cfg(not(any(target_os = "android", target_os = "ios")))]
pub use cron::*;

#[cfg(not(any(target_os = "android", target_os = "ios")))]
pub use headless_webview::*;

pub use project_files::*;
pub use update_management::*;
