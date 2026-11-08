mod actions;
mod apps;
mod observe;
mod permissions;

use std::sync::{Mutex, PoisonError};
use std::time::Duration;

use computer_use::{Computer, Delivery, Error, NativeBackend, Permission};
use std::sync::LazyLock;

use actions::ComputerAction;
use apps::{InstalledApp, RunningApp};
use observe::{AppState, ObserveOptions};
use permissions::PermissionStatus;

const SETTLE_DELAY: Duration = Duration::from_millis(500);
const DEFAULT_MAX_ELEMENTS: usize = 1500;

type NativeComputer = Computer<NativeBackend>;

static COMPUTER: LazyLock<Mutex<Option<NativeComputer>>> = LazyLock::new(|| Mutex::new(None));

fn describe_error(error: Error) -> String {
    match error {
        Error::PermissionDenied(Permission::Accessibility) => {
            permissions::ACCESSIBILITY_MISSING.to_string()
        }
        Error::PermissionDenied(Permission::ScreenRecording) => {
            permissions::SCREEN_RECORDING_MISSING.to_string()
        }
        Error::NoAppState(_) => {
            "Observe the app before acting on it so element indexes are known.".to_string()
        }
        Error::ElementNotFound { index, .. } => format!(
            "Element [{index}] is not in the latest observation of this app. Observe the app again."
        ),
        other => other.to_string(),
    }
}

fn with_computer<T>(
    task: impl FnOnce(&mut NativeComputer) -> Result<T, String>,
) -> Result<T, String> {
    let mut guard = COMPUTER.lock().unwrap_or_else(PoisonError::into_inner);
    if guard.is_none() {
        let computer = Computer::new()
            .map_err(describe_error)?
            .delivery(Delivery::FocusedBackground)
            .settle_delay(SETTLE_DELAY);
        *guard = Some(computer);
    }
    task(guard.as_mut().expect("computer was just created"))
}

async fn run_blocking<T, F>(task: F) -> Result<T, String>
where
    T: Send + 'static,
    F: FnOnce(&mut NativeComputer) -> Result<T, String> + Send + 'static,
{
    tokio::task::spawn_blocking(move || with_computer(task))
        .await
        .map_err(|e| format!("Computer use task failed: {e}"))?
}

#[tauri::command]
pub async fn computer_use_permissions() -> Result<PermissionStatus, String> {
    run_blocking(|computer| Ok(permissions::status(computer))).await
}

#[tauri::command]
pub async fn computer_use_request_permission(permission: String) -> Result<(), String> {
    run_blocking(move |computer| permissions::request(computer, &permission)).await
}

#[tauri::command]
pub async fn computer_use_list_apps() -> Result<Vec<RunningApp>, String> {
    run_blocking(apps::list_running).await
}

#[tauri::command]
pub async fn computer_use_search_installed_apps(
    query: Option<String>,
) -> Result<Vec<InstalledApp>, String> {
    run_blocking(move |computer| apps::list_installed(computer, query.as_deref())).await
}

#[tauri::command]
pub async fn computer_use_get_state(
    app: String,
    window: Option<String>,
    include_screenshot: Option<bool>,
    include_menu_bar: Option<bool>,
    max_elements: Option<usize>,
) -> Result<AppState, String> {
    run_blocking(move |computer| {
        observe::get_state(
            computer,
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
    run_blocking(move |computer| actions::act(computer, &app, action)).await
}
