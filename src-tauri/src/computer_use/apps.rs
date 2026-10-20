use std::collections::HashSet;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use std::thread::sleep;
use std::time::{Duration, Instant};

use applications::{AppInfo, AppInfoContext};
use once_cell::sync::Lazy;
use serde::Serialize;
use xa11y::{App, AppExt};

use super::{describe_error, permissions};

const LAUNCH_TIMEOUT: Duration = Duration::from_secs(10);
const LAUNCH_POLL: Duration = Duration::from_millis(250);

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RunningApp {
    name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pid: Option<u32>,
    windows: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InstalledApp {
    name: String,
    path: PathBuf,
}

fn match_name<T>(items: &[T], query: &str, name: impl Fn(&T) -> &str) -> Option<usize> {
    let query = query.trim().to_lowercase();
    if let Some(index) = items.iter().position(|i| name(i).to_lowercase() == query) {
        return Some(index);
    }
    let partial: Vec<usize> = items
        .iter()
        .enumerate()
        .filter(|(_, i)| name(i).to_lowercase().contains(&query))
        .map(|(index, _)| index)
        .collect();
    (partial.len() == 1).then(|| partial[0])
}

pub fn find_running(query: &str) -> Result<App, String> {
    permissions::ensure_granted()?;
    let query = query.trim();
    let mut apps = App::list().map_err(describe_error)?;

    let position = match query.parse::<u32>() {
        Ok(pid) => apps.iter().position(|a| a.pid == Some(pid)),
        Err(_) => match_name(&apps, query, |a| a.name.as_str()),
    };

    let app = position.map(|i| apps.swap_remove(i)).ok_or_else(|| {
        format!(
            "No running app matched \"{query}\". List running apps, or search installed apps and open it first."
        )
    })?;

    if app.pid == Some(std::process::id()) {
        return Err("AgentOne cannot control its own window.".to_string());
    }
    Ok(app)
}

pub fn list_running() -> Result<Vec<RunningApp>, String> {
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
            RunningApp {
                name: app.name,
                pid: app.pid,
                windows,
            }
        })
        .collect())
}

const INSTALLED_CACHE_TTL: Duration = Duration::from_secs(60);

struct InstalledCache {
    loaded: Instant,
    apps: Vec<InstalledApp>,
}

static INSTALLED: Lazy<Mutex<Option<InstalledCache>>> = Lazy::new(|| Mutex::new(None));

fn installed_apps() -> Result<Vec<InstalledApp>, String> {
    let mut cache = INSTALLED
        .lock()
        .map_err(|_| "The installed app list is unavailable.".to_string())?;
    if let Some(cached) = cache.as_ref() {
        if cached.loaded.elapsed() < INSTALLED_CACHE_TTL {
            return Ok(cached.apps.clone());
        }
    }

    let mut context = AppInfoContext::new(Vec::new());
    context
        .refresh_apps()
        .map_err(|e| format!("Could not list installed apps: {e}"))?;
    let apps: Vec<InstalledApp> = context
        .get_all_apps()
        .into_iter()
        .filter(|app| !app.name.trim().is_empty())
        .map(|app| InstalledApp {
            name: app.name,
            path: app.app_desktop_path,
        })
        .collect();
    *cache = Some(InstalledCache {
        loaded: Instant::now(),
        apps: apps.clone(),
    });
    Ok(apps)
}

pub fn list_installed(query: Option<&str>) -> Result<Vec<InstalledApp>, String> {
    let query = query
        .map(|q| q.trim().to_lowercase())
        .filter(|q| !q.is_empty());
    let mut seen = HashSet::new();
    let mut apps: Vec<InstalledApp> = installed_apps()?
        .into_iter()
        .filter(|app| {
            query
                .as_ref()
                .is_none_or(|q| app.name.to_lowercase().contains(q))
        })
        .filter(|app| seen.insert(app.name.to_lowercase()))
        .collect();
    apps.sort_by_key(|app| app.name.to_lowercase());
    Ok(apps)
}

#[cfg(target_os = "linux")]
fn launch(path: &Path) -> Result<(), String> {
    use std::process::{Command, Stdio};

    let quiet = |command: &mut Command| {
        command
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .status()
            .is_ok_and(|status| status.success())
    };
    if quiet(Command::new("gio").arg("launch").arg(path)) {
        return Ok(());
    }
    let id = path
        .file_name()
        .map(|n| n.to_string_lossy().into_owned())
        .unwrap_or_default();
    if quiet(Command::new("gtk-launch").arg(&id)) {
        return Ok(());
    }
    Err(format!(
        "Could not open {id}. Neither gio nor gtk-launch could start it."
    ))
}

#[cfg(not(target_os = "linux"))]
fn launch(path: &Path) -> Result<(), String> {
    tauri_plugin_opener::open_path(path, None::<&str>).map_err(|e| e.to_string())
}

fn wait_until_running(name: &str) -> bool {
    let started = Instant::now();
    while started.elapsed() < LAUNCH_TIMEOUT {
        if let Ok(apps) = App::list() {
            if match_name(&apps, name, |a| a.name.as_str()).is_some() {
                return true;
            }
        }
        sleep(LAUNCH_POLL);
    }
    false
}

pub fn open(query: &str) -> Result<String, String> {
    permissions::ensure_granted()?;
    let apps = list_installed(None)?;
    let app = match_name(&apps, query, |a| a.name.as_str())
        .map(|i| apps[i].clone())
        .ok_or_else(|| {
            format!(
                "No installed app matched \"{}\". Search installed apps to find its exact name.",
                query.trim()
            )
        })?;

    launch(&app.path)?;
    if wait_until_running(&app.name) {
        Ok(format!("Opened {}.", app.name))
    } else {
        Ok(format!(
            "Asked the system to open {}, but it has not shown up as running yet. It may still be starting, or it may run under a different name.",
            app.name
        ))
    }
}
