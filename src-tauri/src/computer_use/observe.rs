use base64::engine::general_purpose::STANDARD;
use base64::Engine as _;
use computer_use::{CaptureOptions, WindowSelector};
use serde::Serialize;

use super::{apps, describe_error, NativeComputer};

const MAX_SCREENSHOT_SIDE: u32 = 1280;

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
    #[serde(skip_serializing_if = "Option::is_none")]
    window_id: Option<u64>,
    tree: String,
    element_count: usize,
    truncated: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    screenshot: Option<ScreenshotData>,
    #[serde(skip_serializing_if = "Option::is_none")]
    screenshot_error: Option<String>,
}

pub struct ObserveOptions {
    pub window: Option<String>,
    pub include_screenshot: bool,
    pub include_menu_bar: bool,
    pub max_elements: usize,
}

fn window_selector(window: &str) -> WindowSelector {
    match window.trim().parse::<u64>() {
        Ok(id) => WindowSelector::Id(id),
        Err(_) => WindowSelector::Title(window.trim().to_string()),
    }
}

pub fn get_state(
    computer: &mut NativeComputer,
    query: &str,
    options: ObserveOptions,
) -> Result<AppState, String> {
    let (app, key) = apps::find_running(computer, query)?;
    let pid = app.pid.unwrap_or_default();

    let mut capture = CaptureOptions::default()
        .include_tree(true)
        .include_screenshot(options.include_screenshot)
        .include_menu_bar(options.include_menu_bar)
        .max_nodes(options.max_elements)
        .max_screenshot_dimension(Some(MAX_SCREENSHOT_SIDE))
        .launch_if_needed(false);
    if let Some(window) = options.window.as_deref().filter(|w| !w.trim().is_empty()) {
        capture = capture.window(window_selector(window));
    }

    let state = computer
        .get_app_state(&key, &capture)
        .map_err(describe_error)?;

    let screenshot = state.screenshot.as_ref().map(|shot| ScreenshotData {
        data: STANDARD.encode(shot.png()),
        media_type: "image/png".to_string(),
        width: shot.width(),
        height: shot.height(),
    });
    let screenshot_error = (options.include_screenshot && screenshot.is_none()).then(|| {
        if state.notes.is_empty() {
            "No screenshot was captured.".to_string()
        } else {
            state.notes.join(" ")
        }
    });

    let mut lines = vec![format!(
        "Element indexes are valid until the next observation of this app.{}",
        state
            .window
            .id
            .map(|id| format!(" Window id {id}."))
            .unwrap_or_default()
    )];
    lines.push(state.render());
    if !state.notes.is_empty() && screenshot_error.is_none() {
        lines.push(format!("Notes: {}", state.notes.join(" ")));
    }

    Ok(AppState {
        app: state.app.name.clone(),
        pid,
        window: state.window.title.clone(),
        window_id: state.window.id,
        tree: lines.join("\n"),
        element_count: state.elements.len(),
        truncated: state.truncated,
        screenshot,
        screenshot_error,
    })
}
