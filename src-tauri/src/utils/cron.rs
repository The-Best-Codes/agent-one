use chrono::Local;
use croner::Cron as CronSchedule;
use serde::{Deserialize, Serialize};
use std::fs;
use std::io::Write;
use std::path::PathBuf;
use std::str::FromStr;
use std::sync::{Arc, OnceLock};
use tauri::Manager;
use tempfile::NamedTempFile;
use uuid::Uuid;

// TODO: Later on, probably migrate this to the kv table that already exists in the AgentOne DB?
const CRON_STATE_FILE_NAME: &str = "crons.json";
static CRON_MUTATION_LOCK: OnceLock<Arc<tokio::sync::Mutex<()>>> = OnceLock::new();

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Cron {
    pub id: String,
    pub schedule: String,
    pub enabled: bool,
    #[serde(flatten)]
    pub kind: CronKind,
}

#[derive(Clone, Deserialize, Serialize)]
#[serde(
    tag = "type",
    rename_all = "kebab-case",
    rename_all_fields = "camelCase"
)]
pub enum CronKind {
    CronTest {
        message: Option<String>,
    },
    ScheduledAgent {
        title: String,
        prompt: String,
        model_id: Option<String>,
        model_config: Option<serde_json::Value>,
        delay_cutoff_seconds: Option<i64>,
    },
}

#[derive(Deserialize, Serialize)]
struct CronState {
    crons: Vec<Cron>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CronInvocation {
    pub id: String,
    pub delay_seconds: i64,
    #[serde(flatten)]
    pub kind: CronKind,
}

#[tauri::command]
pub fn list_crons(app: tauri::AppHandle) -> Result<Vec<Cron>, String> {
    Ok(read_crons(&app)?
        .into_iter()
        .filter(|cron| matches!(cron.kind, CronKind::CronTest { .. }))
        .collect())
}

#[tauri::command]
pub async fn create_cron(
    app: tauri::AppHandle,
    schedule: String,
    message: Option<String>,
) -> Result<Cron, String> {
    run_blocking(move || create_cron_blocking(app, schedule, message)).await
}

fn create_cron_blocking(
    app: tauri::AppHandle,
    schedule: String,
    message: Option<String>,
) -> Result<Cron, String> {
    let schedule = normalize_schedule(&schedule)?;
    let cron = Cron {
        id: Uuid::new_v4().to_string(),
        schedule,
        enabled: true,
        kind: CronKind::CronTest {
            message: normalize_message(message),
        },
    };

    let mut crons = read_crons(&app)?;
    install_cron(&cron)?;
    crons.push(cron.clone());
    if let Err(error) = write_crons(&app, &crons) {
        let _ = remove_cron(&cron.id);
        return Err(error);
    }

    Ok(cron)
}

#[tauri::command]
pub async fn update_cron(
    app: tauri::AppHandle,
    id: String,
    schedule: String,
    message: Option<String>,
) -> Result<Cron, String> {
    run_blocking(move || update_cron_blocking(app, id, schedule, message)).await
}

fn update_cron_blocking(
    app: tauri::AppHandle,
    id: String,
    schedule: String,
    message: Option<String>,
) -> Result<Cron, String> {
    let schedule = normalize_schedule(&schedule)?;
    let mut crons = read_crons(&app)?;
    let index = find_cron_index(&crons, &id)?;
    let previous = crons[index].clone();
    let updated = Cron {
        id,
        schedule,
        enabled: previous.enabled,
        kind: CronKind::CronTest {
            message: normalize_message(message),
        },
    };

    if updated.enabled {
        install_cron(&updated)?;
    }

    crons[index] = updated.clone();
    if let Err(error) = write_crons(&app, &crons) {
        if updated.enabled {
            let _ = install_cron(&previous);
        }
        return Err(error);
    }

    Ok(updated)
}

#[tauri::command]
pub async fn set_cron_enabled(
    app: tauri::AppHandle,
    id: String,
    enabled: bool,
) -> Result<Cron, String> {
    run_blocking(move || set_cron_enabled_blocking(app, id, enabled)).await
}

fn set_cron_enabled_blocking(
    app: tauri::AppHandle,
    id: String,
    enabled: bool,
) -> Result<Cron, String> {
    let mut crons = read_crons(&app)?;
    let index = find_cron_index(&crons, &id)?;
    let previous = crons[index].clone();

    if previous.enabled == enabled {
        return Ok(previous);
    }

    if enabled {
        install_cron(&previous)?;
    } else {
        disable_cron(&id)?;
    }

    crons[index].enabled = enabled;
    if let Err(error) = write_crons(&app, &crons) {
        if enabled {
            let _ = remove_cron(&id);
        } else {
            let _ = install_cron(&previous);
        }
        return Err(error);
    }

    Ok(crons[index].clone())
}

#[tauri::command]
pub async fn delete_cron(app: tauri::AppHandle, id: String) -> Result<(), String> {
    run_blocking(move || delete_cron_blocking(app, id)).await
}

fn delete_cron_blocking(app: tauri::AppHandle, id: String) -> Result<(), String> {
    let mut crons = read_crons(&app)?;
    let index = find_cron_index(&crons, &id)?;
    let cron = crons[index].clone();

    if cron.enabled {
        remove_cron(&id)?;
    } else {
        let _ = remove_cron(&id);
    }
    crons.remove(index);
    if let Err(error) = write_crons(&app, &crons) {
        if cron.enabled {
            let _ = install_cron(&cron);
        }
        return Err(error);
    }

    Ok(())
}

#[tauri::command]
pub fn get_cron_invocation(
    app: tauri::AppHandle,
    id: String,
) -> Result<Option<CronInvocation>, String> {
    let crons = read_crons(&app)?;
    let Some(cron) = crons.iter().find(|cron| cron.id == id && cron.enabled) else {
        return Ok(None);
    };
    let schedule = CronSchedule::from_str(&cron.schedule)
        .map_err(|error| format!("Invalid stored cron schedule: {error}"))?;
    let now = Local::now();
    let scheduled_at = schedule
        .find_previous_occurrence(&now, true)
        .map_err(|error| format!("Failed to calculate the cron occurrence: {error}"))?;

    let delay_seconds = (now - scheduled_at).num_seconds().max(0);
    if let CronKind::ScheduledAgent {
        delay_cutoff_seconds: Some(cutoff),
        ..
    } = &cron.kind
    {
        if delay_seconds > *cutoff {
            return Ok(None);
        }
    }

    Ok(Some(CronInvocation {
        id: cron.id.clone(),
        delay_seconds,
        kind: cron.kind.clone(),
    }))
}

#[tauri::command]
pub fn list_scheduled_agents(app: tauri::AppHandle) -> Result<Vec<Cron>, String> {
    Ok(read_crons(&app)?
        .into_iter()
        .filter(|cron| matches!(cron.kind, CronKind::ScheduledAgent { .. }))
        .collect())
}

#[tauri::command]
pub async fn create_scheduled_agent(
    app: tauri::AppHandle,
    title: String,
    schedule: String,
    prompt: String,
) -> Result<Cron, String> {
    run_blocking(move || create_scheduled_agent_blocking(app, title, schedule, prompt)).await
}

fn create_scheduled_agent_blocking(
    app: tauri::AppHandle,
    title: String,
    schedule: String,
    prompt: String,
) -> Result<Cron, String> {
    let cron = Cron {
        id: Uuid::new_v4().to_string(),
        schedule: normalize_schedule(&schedule)?,
        enabled: true,
        kind: CronKind::ScheduledAgent {
            title: normalize_required("Title", title)?,
            prompt: normalize_required("Prompt", prompt)?,
            model_id: None,
            model_config: None,
            delay_cutoff_seconds: None,
        },
    };
    let mut crons = read_crons(&app)?;
    install_cron(&cron)?;
    crons.push(cron.clone());
    if let Err(error) = write_crons(&app, &crons) {
        let _ = remove_cron(&cron.id);
        return Err(error);
    }
    Ok(cron)
}

#[tauri::command]
pub async fn update_scheduled_agent(
    app: tauri::AppHandle,
    id: String,
    title: String,
    schedule: String,
    prompt: String,
) -> Result<Cron, String> {
    run_blocking(move || update_scheduled_agent_blocking(app, id, title, schedule, prompt)).await
}

fn update_scheduled_agent_blocking(
    app: tauri::AppHandle,
    id: String,
    title: String,
    schedule: String,
    prompt: String,
) -> Result<Cron, String> {
    let schedule = normalize_schedule(&schedule)?;
    let mut crons = read_crons(&app)?;
    let index = find_cron_index(&crons, &id)?;
    let previous = crons[index].clone();
    let CronKind::ScheduledAgent {
        model_id,
        model_config,
        delay_cutoff_seconds,
        ..
    } = &previous.kind
    else {
        return Err(format!("Cron \"{id}\" is not a scheduled agent"));
    };
    let updated = Cron {
        id,
        schedule,
        enabled: previous.enabled,
        kind: CronKind::ScheduledAgent {
            title: normalize_required("Title", title)?,
            prompt: normalize_required("Prompt", prompt)?,
            model_id: model_id.clone(),
            model_config: model_config.clone(),
            delay_cutoff_seconds: *delay_cutoff_seconds,
        },
    };
    if updated.enabled {
        install_cron(&updated)?;
    }
    crons[index] = updated.clone();
    if let Err(error) = write_crons(&app, &crons) {
        if updated.enabled {
            let _ = install_cron(&previous);
        }
        return Err(error);
    }
    Ok(updated)
}

#[tauri::command]
pub async fn set_scheduled_agent_enabled(
    app: tauri::AppHandle,
    id: String,
    enabled: bool,
) -> Result<Cron, String> {
    run_blocking(move || {
        ensure_scheduled_agent(&app, &id)?;
        set_cron_enabled_blocking(app, id, enabled)
    })
    .await
}

#[tauri::command]
pub async fn delete_scheduled_agent(app: tauri::AppHandle, id: String) -> Result<(), String> {
    run_blocking(move || {
        ensure_scheduled_agent(&app, &id)?;
        delete_cron_blocking(app, id)
    })
    .await
}

async fn run_blocking<T, F>(operation: F) -> Result<T, String>
where
    T: Send + 'static,
    F: FnOnce() -> Result<T, String> + Send + 'static,
{
    let lock = CRON_MUTATION_LOCK.get_or_init(|| Arc::new(tokio::sync::Mutex::new(())));
    let guard = lock.clone().lock_owned().await;
    tokio::task::spawn_blocking(move || {
        let _guard = guard;
        operation()
    })
    .await
    .map_err(|error| format!("Cron operation task failed: {error}"))?
}

fn ensure_scheduled_agent(app: &tauri::AppHandle, id: &str) -> Result<(), String> {
    let crons = read_crons(app)?;
    let index = find_cron_index(&crons, id)?;
    if matches!(crons[index].kind, CronKind::ScheduledAgent { .. }) {
        Ok(())
    } else {
        Err(format!("Cron \"{id}\" is not a scheduled agent"))
    }
}

fn normalize_required(label: &str, value: String) -> Result<String, String> {
    let value = value.trim().to_string();
    if value.is_empty() {
        Err(format!("{label} is required"))
    } else {
        Ok(value)
    }
}

fn normalize_schedule(value: &str) -> Result<String, String> {
    let schedule = value.split_whitespace().collect::<Vec<_>>().join(" ");
    CronSchedule::from_str(&schedule).map_err(|error| format!("Invalid cron schedule: {error}"))?;
    if schedule.split_whitespace().count() != 5 {
        return Err("Cron schedules must contain exactly five fields".to_string());
    }
    Ok(schedule)
}

fn normalize_message(message: Option<String>) -> Option<String> {
    message.and_then(|message| {
        let message = message.trim().to_string();
        (!message.is_empty()).then_some(message)
    })
}

fn find_cron_index(crons: &[Cron], id: &str) -> Result<usize, String> {
    crons
        .iter()
        .position(|cron| cron.id == id)
        .ok_or_else(|| format!("Cron \"{id}\" was not found"))
}

fn resolve_state_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let directory = app
        .path()
        .app_config_dir()
        .map_err(|error| format!("Failed to resolve app config directory: {error}"))?;
    fs::create_dir_all(&directory)
        .map_err(|error| format!("Failed to create app config directory: {error}"))?;
    Ok(directory.join(CRON_STATE_FILE_NAME))
}

fn read_crons(app: &tauri::AppHandle) -> Result<Vec<Cron>, String> {
    let path = resolve_state_path(app)?;
    if !path.exists() {
        return Ok(Vec::new());
    }
    let contents = fs::read_to_string(path)
        .map_err(|error| format!("Failed to read cron schedules: {error}"))?;

    let state = serde_json::from_str::<CronState>(&contents)
        .map_err(|error| format!("Failed to parse cron schedules: {error}"))?;
    for cron in &state.crons {
        normalize_schedule(&cron.schedule)?;
    }
    Ok(state.crons)
}

fn write_crons(app: &tauri::AppHandle, crons: &[Cron]) -> Result<(), String> {
    let contents = serde_json::to_string_pretty(&CronState {
        crons: crons.to_vec(),
    })
    .map_err(|error| format!("Failed to serialize cron schedules: {error}"))?;
    let path = resolve_state_path(app)?;
    let directory = path
        .parent()
        .ok_or_else(|| "Failed to resolve cron schedules directory".to_string())?;
    let mut temporary = NamedTempFile::new_in(directory)
        .map_err(|error| format!("Failed to create temporary cron schedules file: {error}"))?;
    temporary
        .write_all(contents.as_bytes())
        .map_err(|error| format!("Failed to write cron schedules: {error}"))?;
    temporary
        .as_file_mut()
        .sync_all()
        .map_err(|error| format!("Failed to sync cron schedules: {error}"))?;
    temporary
        .persist(&path)
        .map_err(|error| format!("Failed to save cron schedules: {}", error.error))?;
    Ok(())
}

fn cron_url(id: &str) -> String {
    format!("agent-one://cron?v=1&id={id}")
}

#[cfg(target_os = "linux")]
fn gui_env() -> Vec<(String, String)> {
    [
        "DISPLAY",
        "WAYLAND_DISPLAY",
        "XDG_RUNTIME_DIR",
        "DBUS_SESSION_BUS_ADDRESS",
        "XAUTHORITY",
    ]
    .into_iter()
    .filter_map(|key| {
        std::env::var(key)
            .ok()
            .filter(|value| !value.is_empty())
            .map(|value| (key.to_string(), value))
    })
    .collect()
}

fn build_options(cron: &Cron) -> Result<native_cron::CronOptions, String> {
    // `open_url` picks a per-platform opener that doesn't flash a console
    // window on Windows and doesn't get AgentOne killed on Linux when the
    // job's systemd service exits.
    let options = native_cron::CronOptions::open_url(
        cron.id.clone(),
        cron.schedule.clone(),
        cron_url(&cron.id),
    )
    .overwrite(true);
    // Env vars would bring back the PowerShell wrapper on Windows, and
    // nothing outside Linux needs them.
    #[cfg(target_os = "linux")]
    let options = gui_env()
        .into_iter()
        .fold(options, |options, (key, value)| options.env(key, value));
    Ok(options)
}

fn install_cron(cron: &Cron) -> Result<(), String> {
    let options = build_options(cron)?;
    native_cron::validate(options.clone()).map_err(|error| error.to_string())?;
    native_cron::register(options)
        .map_err(|error| error.to_string())
        .map(|_| ())
}

fn disable_cron(id: &str) -> Result<(), String> {
    // Disabling a job that isn't registered is a no-op in native-cron.
    native_cron::job(id)
        .and_then(|job| job.disable())
        .map_err(|error| error.to_string())
}

fn remove_cron(id: &str) -> Result<(), String> {
    native_cron::remove(id).map_err(|error| error.to_string())
}
