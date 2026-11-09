use std::collections::HashSet;
use std::path::PathBuf;

use computer_use::{AppInfo, Backend, Error};
use serde::Serialize;

use super::{NativeComputer, describe_error, permissions};

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RunningApp {
    name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pid: Option<u32>,
    windows: Vec<String>,
    #[serde(skip_serializing_if = "std::ops::Not::not")]
    needs_restart: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InstalledApp {
    name: String,
    path: PathBuf,
}

fn is_self(app: &AppInfo) -> bool {
    app.pid == Some(std::process::id())
}

fn resolve(computer: &NativeComputer, query: &str) -> Result<AppInfo, String> {
    let query = query.trim();
    let lookup = match query.parse::<u32>() {
        Ok(pid) => format!("pid:{pid}"),
        Err(_) => query.to_string(),
    };
    let app = computer.resolve_app(&lookup).map_err(|error| match error {
        Error::AppNotFound(_) => format!(
            "No app matched \"{query}\". List running apps, or search installed apps to find its exact name."
        ),
        other => describe_error(other),
    })?;
    if is_self(&app) {
        return Err("AgentOne cannot control its own window.".to_string());
    }
    Ok(app)
}

pub fn session_key(app: &AppInfo) -> Result<String, String> {
    app.pid
        .map(|pid| format!("pid:{pid}"))
        .ok_or_else(|| format!("{} is not running. Open it with openApp first.", app.name))
}

pub fn find_running(computer: &NativeComputer, query: &str) -> Result<(AppInfo, String), String> {
    permissions::ensure_granted(computer)?;
    let app = resolve(computer, query)?;
    if !app.is_running {
        return Err(format!(
            "{} is not running. Open it with openApp first.",
            app.name
        ));
    }
    if app.needs_restart {
        return Err(format!(
            "{name} is running but can't be inspected or controlled until it is restarted. Ask the user to quit {name} completely and open it again.",
            name = app.name
        ));
    }
    let key = session_key(&app)?;
    Ok((app, key))
}

pub fn list_running(computer: &mut NativeComputer) -> Result<Vec<RunningApp>, String> {
    permissions::ensure_granted(computer)?;
    let apps = computer.list_apps().map_err(describe_error)?;
    Ok(apps
        .into_iter()
        .filter(|app| app.is_running && !is_self(app))
        .map(|app| {
            let mut windows: Vec<String> = computer
                .backend()
                .list_windows(&app)
                .unwrap_or_default()
                .into_iter()
                .filter_map(|w| w.title)
                .filter(|title| !title.is_empty())
                .collect();
            if windows.is_empty() {
                windows.extend(app.window_title.filter(|title| !title.is_empty()));
            }
            RunningApp {
                name: app.name,
                pid: app.pid,
                windows,
                needs_restart: app.needs_restart,
            }
        })
        .collect())
}

pub fn list_installed(
    computer: &mut NativeComputer,
    query: Option<&str>,
) -> Result<Vec<InstalledApp>, String> {
    let query = query
        .map(|q| q.trim().to_lowercase())
        .filter(|q| !q.is_empty());
    let mut seen = HashSet::new();
    let mut apps: Vec<InstalledApp> = computer
        .list_apps()
        .map_err(describe_error)?
        .into_iter()
        .filter(|app| !app.name.trim().is_empty() && !is_self(app))
        .filter(|app| {
            query
                .as_ref()
                .is_none_or(|q| app.name.to_lowercase().contains(q))
        })
        .filter_map(|app| {
            let path = app.path?;
            Some(InstalledApp {
                name: app.name,
                path,
            })
        })
        .filter(|app| seen.insert(app.path.clone()))
        .collect();
    apps.sort_by_key(|app| app.name.to_lowercase());
    Ok(apps)
}

pub fn open(computer: &mut NativeComputer, query: &str) -> Result<String, String> {
    permissions::ensure_granted(computer)?;
    let app = resolve(computer, query)?;
    if app.is_running {
        return Ok(format!("{} is already running.", app.name));
    }
    let launched = computer
        .backend()
        .launch_app(&app)
        .map_err(describe_error)?;
    Ok(format!(
        "Opened {} in the background without taking focus.",
        launched.name
    ))
}
