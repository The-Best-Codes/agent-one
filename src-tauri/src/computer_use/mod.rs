mod keys;
mod permissions;
mod snapshot;

use std::collections::HashMap;
use std::sync::Mutex;
use std::thread::sleep;
use std::time::Duration;

use base64::engine::general_purpose::STANDARD;
use base64::Engine as _;
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use xa11y::{
    anchor_point, Anchor, App, AppExt, ClickOptions, ClickTarget, Element, Error, MouseButton,
    Point, ScrollDelta,
};

use permissions::PermissionStatus;
use snapshot::Snapshot;

const MAX_SCREENSHOT_SIDE: u32 = 1280;
const DEFAULT_MAX_ELEMENTS: usize = 1500;
const ACTIVATE_DELAY: Duration = Duration::from_millis(150);
const SETTLE_DELAY: Duration = Duration::from_millis(200);

static SNAPSHOTS: Lazy<Mutex<HashMap<u32, Snapshot>>> = Lazy::new(|| Mutex::new(HashMap::new()));

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppInfo {
    name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pid: Option<u32>,
    windows: Vec<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScreenshotData {
    data: String,
    media_type: String,
    width: u32,
    height: u32,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppState {
    app: String,
    pid: u32,
    #[serde(skip_serializing_if = "Option::is_none")]
    window: Option<String>,
    tree: String,
    element_count: usize,
    truncated: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    screenshot: Option<ScreenshotData>,
    #[serde(skip_serializing_if = "Option::is_none")]
    screenshot_error: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(
    tag = "type",
    rename_all = "camelCase",
    rename_all_fields = "camelCase"
)]
pub enum ComputerAction {
    Click {
        element_index: Option<usize>,
        x: Option<i32>,
        y: Option<i32>,
        button: Option<String>,
        click_count: Option<u32>,
    },
    TypeText {
        text: String,
        element_index: Option<usize>,
    },
    PressKey {
        key: String,
    },
    Scroll {
        direction: String,
        amount: Option<i32>,
        element_index: Option<usize>,
        x: Option<i32>,
        y: Option<i32>,
    },
    Drag {
        from_x: i32,
        from_y: i32,
        to_x: i32,
        to_y: i32,
    },
    SetValue {
        element_index: usize,
        value: String,
    },
    PerformAction {
        element_index: usize,
        action: String,
    },
}

fn describe_error(error: Error) -> String {
    match error {
        Error::ElementStale { .. } => {
            "The element no longer exists. Observe the app again to get fresh element indexes."
                .to_string()
        }
        other => other.to_string(),
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

fn find_app(query: &str) -> Result<App, String> {
    permissions::ensure_granted()?;
    let query = query.trim();
    let mut apps = App::list().map_err(describe_error)?;

    let position = if let Ok(pid) = query.parse::<u32>() {
        apps.iter().position(|a| a.pid == Some(pid))
    } else {
        let lower = query.to_lowercase();
        apps.iter()
            .position(|a| a.name.to_lowercase() == lower)
            .or_else(|| {
                let matches: Vec<usize> = apps
                    .iter()
                    .enumerate()
                    .filter(|(_, a)| a.name.to_lowercase().contains(&lower))
                    .map(|(i, _)| i)
                    .collect();
                (matches.len() == 1).then(|| matches[0])
            })
    };

    let app = position
        .map(|i| apps.swap_remove(i))
        .ok_or_else(|| {
            format!("No running app matched \"{query}\". List apps to see what is running; the app may need to be opened first.")
        })?;

    if app.pid == Some(std::process::id()) {
        return Err("AgentOne cannot control its own window.".to_string());
    }
    Ok(app)
}

fn activate(window: Option<&Element>) {
    if let Some(window) = window {
        if window.activate().is_ok() {
            sleep(ACTIVATE_DELAY);
        }
    }
}

fn capture(window: &Element) -> Result<(ScreenshotData, xa11y::Screenshot), String> {
    let bounds = window
        .bounds
        .ok_or_else(|| "The window has no bounds to capture.".to_string())?;
    let mut shot = xa11y::screenshot_region(bounds).map_err(describe_error)?;

    let longest = shot.width.max(shot.height);
    if longest > MAX_SCREENSHOT_SIDE {
        let ratio = f64::from(MAX_SCREENSHOT_SIDE) / f64::from(longest);
        let width = ((f64::from(shot.width) * ratio).round() as u32).max(1);
        let height = ((f64::from(shot.height) * ratio).round() as u32).max(1);
        shot = shot.resize(width, height).map_err(describe_error)?;
    }

    let png = shot.to_png().map_err(describe_error)?;
    let data = ScreenshotData {
        data: STANDARD.encode(png),
        media_type: "image/png".to_string(),
        width: shot.width,
        height: shot.height,
    };
    shot.pixels = Vec::new();
    Ok((data, shot))
}

fn get_state(
    query: String,
    window_query: Option<String>,
    include_screenshot: bool,
    include_menu_bar: bool,
    max_elements: usize,
) -> Result<AppState, String> {
    let app = find_app(&query)?;
    let pid = app
        .pid
        .ok_or_else(|| "The app has no process id.".to_string())?;
    let roots = app.children().map_err(describe_error)?;

    if include_screenshot {
        let windows: Vec<Element> = roots
            .iter()
            .filter(|e| snapshot::is_window(e))
            .cloned()
            .collect();
        activate(snapshot::pick_window(&windows, window_query.as_deref()));
    }

    let tree = snapshot::build_tree(
        &roots,
        window_query.as_deref(),
        include_menu_bar,
        max_elements,
    );

    let mut screenshot = None;
    let mut stored_shot = None;
    let mut screenshot_error = None;
    if include_screenshot {
        match tree.window.as_ref().map(capture) {
            Some(Ok((data, shot))) => {
                screenshot = Some(data);
                stored_shot = Some(shot);
            }
            Some(Err(error)) => screenshot_error = Some(error),
            None => screenshot_error = Some("The app has no window to capture.".to_string()),
        }
    }

    let window = tree.window.as_ref().and_then(|w| w.name.clone());
    let text = format!(
        "App \"{}\" (pid {pid}). Element indexes are valid until the next observation.\n{}",
        app.name, tree.text
    );
    let element_count = tree.elements.len();

    SNAPSHOTS
        .lock()
        .map_err(|_| "Computer use state is unavailable.".to_string())?
        .insert(
            pid,
            Snapshot {
                app_name: app.name.clone(),
                elements: tree.elements,
                window: tree.window,
                screenshot: stored_shot,
            },
        );

    Ok(AppState {
        app: app.name,
        pid,
        window,
        tree: text,
        element_count,
        truncated: tree.truncated,
        screenshot,
        screenshot_error,
    })
}

fn element_at(snapshot: &Snapshot, index: usize) -> Result<&Element, String> {
    snapshot.elements.get(index).ok_or_else(|| {
        format!(
            "Element [{index}] is not in the latest observation of \"{}\". Observe the app again.",
            snapshot.app_name
        )
    })
}

fn element_center(element: &Element) -> Result<Point, String> {
    element
        .bounds
        .map(|rect| anchor_point(&rect, Anchor::Center))
        .ok_or_else(|| "The element has no on-screen position.".to_string())
}

fn screenshot_point(snapshot: &Snapshot, x: i32, y: i32) -> Result<Point, String> {
    let shot = snapshot.screenshot.as_ref().ok_or_else(|| {
        "Coordinates need a screenshot. Observe the app with a screenshot first.".to_string()
    })?;
    shot.image_to_desktop(Point::new(x, y))
        .map_err(describe_error)
}

fn target_point(
    snapshot: &Snapshot,
    element_index: Option<usize>,
    x: Option<i32>,
    y: Option<i32>,
) -> Result<Point, String> {
    match (element_index, x, y) {
        (Some(index), _, _) => element_center(element_at(snapshot, index)?),
        (None, Some(x), Some(y)) => screenshot_point(snapshot, x, y),
        _ => Err("Provide either elementIndex or both x and y.".to_string()),
    }
}

fn parse_button(button: Option<&str>) -> Result<MouseButton, String> {
    match button.unwrap_or("left").to_ascii_lowercase().as_str() {
        "left" | "l" => Ok(MouseButton::Left),
        "right" | "r" => Ok(MouseButton::Right),
        "middle" | "m" => Ok(MouseButton::Middle),
        other => Err(format!("Unknown mouse button \"{other}\"")),
    }
}

fn label(snapshot: &Snapshot, index: usize) -> String {
    snapshot
        .elements
        .get(index)
        .map(|e| match e.name.as_deref().filter(|n| !n.is_empty()) {
            Some(name) => format!("[{index}] {} \"{name}\"", e.role),
            None => format!("[{index}] {}", e.role),
        })
        .unwrap_or_else(|| format!("[{index}]"))
}

fn act(query: String, action: ComputerAction) -> Result<String, String> {
    let app = find_app(&query)?;
    let pid = app
        .pid
        .ok_or_else(|| "The app has no process id.".to_string())?;
    let snapshots = SNAPSHOTS
        .lock()
        .map_err(|_| "Computer use state is unavailable.".to_string())?;
    let snapshot = snapshots.get(&pid).ok_or_else(|| {
        format!(
            "Observe \"{}\" before acting on it so element indexes are known.",
            app.name
        )
    })?;
    let window = snapshot.window.as_ref();
    let input = || xa11y::input_sim().map_err(describe_error);

    let message = match action {
        ComputerAction::Click {
            element_index,
            x,
            y,
            button,
            click_count,
        } => {
            let button = parse_button(button.as_deref())?;
            let count = click_count.unwrap_or(1).clamp(1, 3);

            let pressed = match element_index {
                Some(index) if button == MouseButton::Left && count == 1 => {
                    let element = element_at(snapshot, index)?;
                    element.actions.iter().any(|a| a == "press") && element.press().is_ok()
                }
                _ => false,
            };

            if !pressed {
                let point = target_point(snapshot, element_index, x, y)?;
                activate(window);
                input()?
                    .mouse()
                    .click_with(
                        ClickTarget::from(point),
                        ClickOptions::new().button(button).count(count),
                    )
                    .map_err(describe_error)?;
            }

            match element_index {
                Some(index) => format!("Clicked {}.", label(snapshot, index)),
                None => format!("Clicked at ({}, {}).", x.unwrap_or(0), y.unwrap_or(0)),
            }
        }
        ComputerAction::TypeText {
            text,
            element_index,
        } => {
            let typed = match element_index {
                Some(index) => element_at(snapshot, index)?.type_text(&text).is_ok(),
                None => false,
            };
            if !typed {
                if let Some(index) = element_index {
                    let _ = element_at(snapshot, index)?.focus();
                }
                activate(window);
                input()?
                    .keyboard()
                    .type_text(&text)
                    .map_err(describe_error)?;
            }
            format!("Typed {} characters.", text.chars().count())
        }
        ComputerAction::PressKey { key } => {
            let chord = keys::parse_chord(&key)?;
            activate(window);
            let sim = input()?;
            let keyboard = sim.keyboard();
            if chord.held.is_empty() {
                keyboard.press(chord.key).map_err(describe_error)?;
            } else {
                keyboard
                    .chord(chord.key, &chord.held)
                    .map_err(describe_error)?;
            }
            format!("Pressed {key}.")
        }
        ComputerAction::Scroll {
            direction,
            amount,
            element_index,
            x,
            y,
        } => {
            let amount = amount.unwrap_or(5).clamp(1, 50);
            let delta = match direction.to_ascii_lowercase().as_str() {
                "up" | "u" => ScrollDelta::vertical(-amount),
                "down" | "d" => ScrollDelta::vertical(amount),
                "left" | "l" => ScrollDelta::horizontal(-amount),
                "right" | "r" => ScrollDelta::horizontal(amount),
                other => return Err(format!("Unknown scroll direction \"{other}\"")),
            };
            let point = match (element_index, x, y) {
                (None, None, None) => {
                    element_center(window.ok_or("The app has no window to scroll.")?)?
                }
                _ => target_point(snapshot, element_index, x, y)?,
            };
            activate(window);
            input()?
                .mouse()
                .scroll(point, delta)
                .map_err(describe_error)?;
            format!("Scrolled {direction} by {amount}.")
        }
        ComputerAction::Drag {
            from_x,
            from_y,
            to_x,
            to_y,
        } => {
            let from = screenshot_point(snapshot, from_x, from_y)?;
            let to = screenshot_point(snapshot, to_x, to_y)?;
            activate(window);
            input()?.mouse().drag(from, to).map_err(describe_error)?;
            format!("Dragged from ({from_x}, {from_y}) to ({to_x}, {to_y}).")
        }
        ComputerAction::SetValue {
            element_index,
            value,
        } => {
            element_at(snapshot, element_index)?
                .set_value(&value)
                .map_err(describe_error)?;
            format!("Set the value of {}.", label(snapshot, element_index))
        }
        ComputerAction::PerformAction {
            element_index,
            action,
        } => {
            let name = action.trim().to_lowercase().replace([' ', '-'], "_");
            element_at(snapshot, element_index)?
                .perform_action(&name)
                .map_err(describe_error)?;
            format!(
                "Performed \"{name}\" on {}.",
                label(snapshot, element_index)
            )
        }
    };

    drop(snapshots);
    sleep(SETTLE_DELAY);
    Ok(message)
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
pub async fn computer_use_list_apps() -> Result<Vec<AppInfo>, String> {
    run_blocking(|| {
        permissions::ensure_granted()?;
        let own_pid = std::process::id();
        let apps = App::list().map_err(describe_error)?;
        Ok(apps
            .into_iter()
            .filter(|app| app.pid != Some(own_pid))
            .map(|app| {
                let windows = app
                    .windows()
                    .unwrap_or_default()
                    .into_iter()
                    .filter_map(|w| w.name.clone())
                    .filter(|n| !n.is_empty())
                    .collect();
                AppInfo {
                    name: app.name,
                    pid: app.pid,
                    windows,
                }
            })
            .collect())
    })
    .await
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
        get_state(
            app,
            window,
            include_screenshot.unwrap_or(true),
            include_menu_bar.unwrap_or(false),
            max_elements.unwrap_or(DEFAULT_MAX_ELEMENTS).clamp(50, 5000),
        )
    })
    .await
}

#[tauri::command]
pub async fn computer_use_act(app: String, action: ComputerAction) -> Result<String, String> {
    run_blocking(move || act(app, action)).await
}
