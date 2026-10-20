mod actions;
mod apps;
mod keys;
mod observe;
mod permissions;
mod state;
mod tree;

use std::thread::sleep;
use std::time::Duration;

use xa11y::{Element, Error};

use actions::ComputerAction;
use apps::{InstalledApp, RunningApps};
use observe::{AppState, ObserveOptions};
use permissions::PermissionStatus;

const ACTIVATE_DELAY: Duration = Duration::from_millis(150);
const DEFAULT_MAX_ELEMENTS: usize = 1500;

fn describe_error(error: Error) -> String {
    match error {
        Error::ElementStale { .. } => {
            "The element no longer exists. Observe the app again to get fresh element indexes."
                .to_string()
        }
        other => other.to_string(),
    }
}

fn activate(window: Option<&Element>) {
    if let Some(window) = window {
        if window.activate().is_ok() {
            sleep(ACTIVATE_DELAY);
        }
    }
}

async fn run_blocking<T, F>(task: F) -> Result<T, String>
where
    T: Send + 'static,
    F: FnOnce() -> Result<T, String> + Send + 'static,
{
    tokio::task::spawn_blocking(task)
        .await
        .map_err(|e| format!("Computer use task failed: {e}"))?
}

#[tauri::command]
pub fn computer_use_permissions() -> PermissionStatus {
    permissions::status()
}

#[tauri::command]
pub fn computer_use_request_permission(permission: String) -> Result<(), String> {
    permissions::request(&permission)
}

#[tauri::command]
pub async fn computer_use_list_apps() -> Result<RunningApps, String> {
    run_blocking(apps::list_running).await
}

#[tauri::command]
pub async fn computer_use_search_installed_apps(
    query: Option<String>,
) -> Result<Vec<InstalledApp>, String> {
    run_blocking(move || apps::list_installed(query.as_deref())).await
}

#[tauri::command]
pub async fn computer_use_get_state(
    app: String,
    window: Option<String>,
    include_screenshot: Option<bool>,
    include_menu_bar: Option<bool>,
    max_elements: Option<usize>,
) -> Result<AppState, String> {
    run_blocking(move || {
        observe::get_state(
            &app,
            ObserveOptions {
                window,
                include_screenshot: include_screenshot.unwrap_or(true),
                include_menu_bar: include_menu_bar.unwrap_or(false),
                max_elements: max_elements.unwrap_or(DEFAULT_MAX_ELEMENTS).clamp(50, 5000),
            },
        )
    })
    .await
}

#[tauri::command]
pub async fn computer_use_act(app: String, action: ComputerAction) -> Result<String, String> {
    run_blocking(move || actions::act(&app, action)).await
}
