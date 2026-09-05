use chrono::Local;
use croner::Cron as CronSchedule;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::str::FromStr;
use tauri::Manager;
use uuid::Uuid;

const CRON_STATE_FILE_NAME: &str = "crons.json";

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Cron {
    pub id: String,
    pub schedule: String,
    pub message: Option<String>,
    pub enabled: bool,
}

#[derive(Deserialize, Serialize)]
struct CronState {
    crons: Vec<Cron>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CronInvocation {
    pub id: String,
    pub message: Option<String>,
    pub delay_seconds: i64,
}

#[tauri::command]
pub fn list_crons(app: tauri::AppHandle) -> Result<Vec<Cron>, String> {
    read_crons(&app)
}

#[tauri::command]
pub fn create_cron(
    app: tauri::AppHandle,
    schedule: String,
    message: Option<String>,
) -> Result<Cron, String> {
    let schedule = normalize_schedule(&schedule)?;
    let cron = Cron {
        id: Uuid::new_v4().to_string(),
        schedule,
        message: normalize_message(message),
        enabled: true,
    };

    install_cron(&cron)?;
    let mut crons = read_crons(&app)?;
    crons.push(cron.clone());
    if let Err(error) = write_crons(&app, &crons) {
        let _ = remove_cron(&cron.id);
        return Err(error);
    }

    Ok(cron)
}

#[tauri::command]
pub fn update_cron(
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
        message: normalize_message(message),
        enabled: previous.enabled,
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
pub fn set_cron_enabled(app: tauri::AppHandle, id: String, enabled: bool) -> Result<Cron, String> {
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
pub fn delete_cron(app: tauri::AppHandle, id: String) -> Result<(), String> {
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

    Ok(Some(CronInvocation {
        id: cron.id.clone(),
        message: cron.message.clone(),
        delay_seconds: (now - scheduled_at).num_seconds().max(0),
    }))
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
    fs::write(resolve_state_path(app)?, contents)
        .map_err(|error| format!("Failed to save cron schedules: {error}"))
}

fn resolve_executable_path() -> Result<PathBuf, String> {
    std::env::current_exe().map_err(|error| format!("Failed to resolve app executable: {error}"))
}

fn cron_url(id: &str) -> String {
    format!("agent-one://cron?v=1&id={id}")
}

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
    let executable = resolve_executable_path()?;
    let mut options = native_cron::CronOptions::new(
        cron.id.clone(),
        cron.schedule.clone(),
        [
            executable.to_string_lossy().into_owned(),
            cron_url(&cron.id),
        ],
    )
    .overwrite(true);
    for (key, value) in gui_env() {
        options = options.env(key, value);
    }
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
    match native_cron::job(id) {
        Ok(job) => job.disable().map_err(|error| error.to_string())?,
        Err(error) => {
            let message = error.to_string();
            if !message.to_lowercase().contains("not registered")
                && !matches!(error, native_cron::Error::NotRegistered(_))
            {
                return Err(message);
            }
        }
    }
    Ok(())
}

fn remove_cron(id: &str) -> Result<(), String> {
    native_cron::remove(id).map_err(|error| error.to_string())
}
