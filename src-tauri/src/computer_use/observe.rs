use base64::engine::general_purpose::STANDARD;
use base64::Engine as _;
use serde::Serialize;
use xa11y::{Element, Screenshot};

use super::state::{snapshots, Snapshot};
use super::{activate, apps, describe_error, tree};

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

fn capture(window: &Element) -> Result<(ScreenshotData, Screenshot), String> {
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

pub fn get_state(query: &str, options: ObserveOptions) -> Result<AppState, String> {
    let app = apps::find_running(query)?;
    let pid = app
        .pid
        .ok_or_else(|| "The app has no process id.".to_string())?;
    let roots = app.children().map_err(describe_error)?;
    let window_query = options.window.as_deref();

    if options.include_screenshot {
        let windows: Vec<Element> = roots
            .iter()
            .filter(|e| tree::is_window(e))
            .cloned()
            .collect();
        activate(tree::pick_window(&windows, window_query));
    }

    let tree = tree::build_tree(
        &roots,
        window_query,
        options.include_menu_bar,
        options.max_elements,
    );

    let mut screenshot = None;
    let mut stored_shot = None;
    let mut screenshot_error = None;
    if options.include_screenshot {
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

    snapshots().insert(
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
