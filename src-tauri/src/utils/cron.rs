use chrono::Local;
use croner::Cron as CronSchedule;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::process::Command;
use std::str::FromStr;
use tauri::Manager;
use uuid::Uuid;

const CRON_STATE_FILE_NAME: &str = "crons.json";
#[cfg(target_os = "linux")]
const CRON_MARKER_PREFIX: &str = "# agent-one-cron: ";
#[cfg(target_os = "macos")]
const CRON_LABEL_PREFIX: &str = "dev.agent-one.cron";
#[cfg(target_os = "windows")]
const CRON_TASK_PREFIX: &str = "AgentOneCron";

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
    let mut crons = read_crons(&app)?;

    install_cron_for_platform(&cron)?;
    crons.push(cron.clone());
    if let Err(error) = write_crons(&app, &crons) {
        let _ = remove_cron_for_platform(&cron.id);
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
        remove_cron_for_platform(&updated.id)?;
        if let Err(error) = install_cron_for_platform(&updated) {
            let _ = install_cron_for_platform(&previous);
            return Err(error);
        }
    }

    crons[index] = updated.clone();
    if let Err(error) = write_crons(&app, &crons) {
        if updated.enabled {
            let _ = remove_cron_for_platform(&updated.id);
            let _ = install_cron_for_platform(&previous);
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
        install_cron_for_platform(&previous)?;
    } else {
        remove_cron_for_platform(&id)?;
    }

    crons[index].enabled = enabled;
    if let Err(error) = write_crons(&app, &crons) {
        if enabled {
            let _ = remove_cron_for_platform(&id);
        } else {
            let _ = install_cron_for_platform(&previous);
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
        remove_cron_for_platform(&id)?;
    }
    crons.remove(index);
    if let Err(error) = write_crons(&app, &crons) {
        if cron.enabled {
            let _ = install_cron_for_platform(&cron);
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
    ParsedCron::parse(&schedule)?;
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

#[derive(Clone)]
#[cfg_attr(target_os = "linux", allow(dead_code))]
struct CronField {
    values: Vec<u8>,
    wildcard: bool,
}

#[cfg_attr(target_os = "linux", allow(dead_code))]
struct ParsedCron {
    minute: CronField,
    hour: CronField,
    day: CronField,
    month: CronField,
    weekday: CronField,
}

impl ParsedCron {
    fn parse(schedule: &str) -> Result<Self, String> {
        let fields = schedule.split_whitespace().collect::<Vec<_>>();
        if fields.len() != 5 {
            return Err("Cron schedules must contain exactly five fields".to_string());
        }
        Ok(Self {
            minute: parse_field(fields[0], 0, 59, &[])?,
            hour: parse_field(fields[1], 0, 23, &[])?,
            day: parse_field(fields[2], 1, 31, &[])?,
            month: parse_field(
                fields[3],
                1,
                12,
                &[
                    "JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV",
                    "DEC",
                ],
            )?,
            weekday: parse_field(
                fields[4],
                0,
                7,
                &["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"],
            )?,
        })
    }
}

fn parse_field(value: &str, min: u8, max: u8, names: &[&str]) -> Result<CronField, String> {
    let wildcard = value == "*";
    let mut values = Vec::new();
    for part in value.split(',') {
        let (range, step) = match part.split_once('/') {
            Some((range, step)) => (
                range,
                step.parse::<u8>()
                    .map_err(|_| format!("Invalid cron step in \"{value}\""))?,
            ),
            None => (part, 1),
        };
        if step == 0 {
            return Err("Cron steps must be greater than zero".to_string());
        }
        let (start, end) = if range == "*" {
            (min, max)
        } else if let Some((start, end)) = range.split_once('-') {
            (
                parse_field_value(start, min, max, names)?,
                parse_field_value(end, min, max, names)?,
            )
        } else {
            let value = parse_field_value(range, min, max, names)?;
            (value, value)
        };
        if start > end {
            return Err("Wrapping cron ranges are not supported".to_string());
        }
        values.extend((start..=end).step_by(usize::from(step)));
    }
    if max == 7 {
        for value in &mut values {
            if *value == 7 {
                *value = 0;
            }
        }
    }
    values.sort_unstable();
    values.dedup();
    Ok(CronField { values, wildcard })
}

fn parse_field_value(value: &str, min: u8, max: u8, names: &[&str]) -> Result<u8, String> {
    let uppercase = value.to_ascii_uppercase();
    let parsed = names
        .iter()
        .position(|name| *name == uppercase)
        .map(|index| min + index as u8)
        .or_else(|| value.parse::<u8>().ok())
        .ok_or_else(|| format!("Unsupported cron value \"{value}\""))?;
    if !(min..=max).contains(&parsed) {
        return Err(format!("Cron value {parsed} is outside {min}-{max}"));
    }
    Ok(parsed)
}

fn resolve_executable_path() -> Result<PathBuf, String> {
    std::env::current_exe().map_err(|error| format!("Failed to resolve app executable: {error}"))
}

fn cron_url(id: &str) -> String {
    format!("agent-one://cron?v=1&id={id}")
}

fn install_cron_for_platform(cron: &Cron) -> Result<(), String> {
    #[cfg(target_os = "linux")]
    return install_linux_cron(cron);
    #[cfg(target_os = "macos")]
    return install_macos_cron(cron);
    #[cfg(target_os = "windows")]
    return install_windows_cron(cron);
    #[allow(unreachable_code)]
    Err("Crons are not supported on this platform".to_string())
}

fn remove_cron_for_platform(id: &str) -> Result<(), String> {
    #[cfg(target_os = "linux")]
    return remove_linux_cron(id);
    #[cfg(target_os = "macos")]
    return remove_macos_cron(id);
    #[cfg(target_os = "windows")]
    return remove_windows_cron(id);
    #[allow(unreachable_code)]
    Err("Crons are not supported on this platform".to_string())
}

#[cfg(target_os = "linux")]
fn install_linux_cron(cron: &Cron) -> Result<(), String> {
    if command_exists("systemctl") {
        match install_linux_systemd_cron(cron) {
            Ok(()) => return Ok(()),
            Err(error) if !command_exists("crontab") => return Err(error),
            Err(_) => {}
        }
    }
    if command_exists("crontab") {
        return install_linux_crontab_cron(cron);
    }

    Err("Neither systemd user timers nor crontab are available on this Linux system".to_string())
}

#[cfg(target_os = "linux")]
fn install_linux_crontab_cron(cron: &Cron) -> Result<(), String> {
    let existing = read_linux_crontab()?;
    let mut next = filter_linux_crontab(&existing, &cron.id);
    let executable = shell_quote(&resolve_executable_path()?.to_string_lossy());
    let url = shell_quote(&cron_url(&cron.id));
    next.push_str(&format!(
        "{CRON_MARKER_PREFIX}{}\n{} {}{executable} {url}\n",
        cron.id,
        cron.schedule,
        linux_cron_environment_prefix(),
    ));
    write_linux_crontab(&next)
}

#[cfg(target_os = "linux")]
fn remove_linux_cron(id: &str) -> Result<(), String> {
    let mut errors = Vec::new();
    if command_exists("systemctl") {
        if let Err(error) = remove_linux_systemd_cron(id) {
            errors.push(error);
        }
    }
    if command_exists("crontab") {
        let existing = read_linux_crontab()?;
        if let Err(error) = write_linux_crontab(&filter_linux_crontab(&existing, id)) {
            errors.push(error);
        }
    }
    if errors.is_empty() {
        Ok(())
    } else {
        Err(errors.join(" | "))
    }
}

#[cfg(target_os = "linux")]
fn install_linux_systemd_cron(cron: &Cron) -> Result<(), String> {
    let directory = linux_systemd_user_dir()?;
    fs::create_dir_all(&directory)
        .map_err(|error| format!("Failed to create systemd user directory: {error}"))?;
    let service_name = format!("agent-one-cron-{}.service", cron.id);
    let timer_name = format!("agent-one-cron-{}.timer", cron.id);
    let executable = systemd_quote(&resolve_executable_path()?.to_string_lossy());
    let url = systemd_quote(&cron_url(&cron.id));
    let service = format!(
        "[Unit]\nDescription=Launch AgentOne for cron {}\n\n[Service]\nType=oneshot\n{}ExecStart={executable} {url}\n",
        cron.id,
        linux_systemd_environment_lines(),
    );
    let on_calendar = systemd_calendar_lines(&ParsedCron::parse(&cron.schedule)?);
    let timer = format!(
        "[Unit]\nDescription=AgentOne cron {}\n\n[Timer]\n{on_calendar}Persistent=true\nUnit={service_name}\n\n[Install]\nWantedBy=timers.target\n",
        cron.id,
    );
    fs::write(directory.join(&service_name), service)
        .map_err(|error| format!("Failed to write systemd service: {error}"))?;
    fs::write(directory.join(&timer_name), timer)
        .map_err(|error| format!("Failed to write systemd timer: {error}"))?;
    run_systemctl_user(["daemon-reload"])?;
    run_systemctl_user(["enable", "--now", &timer_name])
}

#[cfg(target_os = "linux")]
fn remove_linux_systemd_cron(id: &str) -> Result<(), String> {
    let directory = linux_systemd_user_dir()?;
    let service_name = format!("agent-one-cron-{id}.service");
    let timer_name = format!("agent-one-cron-{id}.timer");
    let _ = run_systemctl_user(["disable", "--now", &timer_name]);
    for path in [directory.join(service_name), directory.join(timer_name)] {
        if path.exists() {
            fs::remove_file(path)
                .map_err(|error| format!("Failed to remove systemd cron: {error}"))?;
        }
    }
    let _ = run_systemctl_user(["daemon-reload"]);
    Ok(())
}

#[cfg(target_os = "linux")]
fn systemd_calendar_lines(cron: &ParsedCron) -> String {
    let date = format!(
        "*-{}-{}",
        systemd_field(&cron.month),
        systemd_field(&cron.day)
    );
    let time = format!(
        "{}:{}:00",
        systemd_field(&cron.hour),
        systemd_field(&cron.minute)
    );
    let weekdays = cron
        .weekday
        .values
        .iter()
        .map(|weekday| ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][*weekday as usize])
        .collect::<Vec<_>>()
        .join(",");

    if !cron.day.wildcard && !cron.weekday.wildcard {
        format!(
            "OnCalendar={date} {time}\nOnCalendar={weekdays} *-{}-* {time}\n",
            systemd_field(&cron.month)
        )
    } else if cron.weekday.wildcard {
        format!("OnCalendar={date} {time}\n")
    } else {
        format!(
            "OnCalendar={weekdays} *-{}-* {time}\n",
            systemd_field(&cron.month)
        )
    }
}

#[cfg(target_os = "linux")]
fn systemd_field(field: &CronField) -> String {
    if field.wildcard {
        "*".to_string()
    } else {
        field
            .values
            .iter()
            .map(u8::to_string)
            .collect::<Vec<_>>()
            .join(",")
    }
}

#[cfg(target_os = "linux")]
fn linux_systemd_user_dir() -> Result<PathBuf, String> {
    let home = std::env::var("HOME").map_err(|error| format!("Failed to resolve HOME: {error}"))?;
    Ok(PathBuf::from(home).join(".config/systemd/user"))
}

#[cfg(target_os = "linux")]
fn run_systemctl_user<const N: usize>(args: [&str; N]) -> Result<(), String> {
    let output = Command::new("systemctl")
        .arg("--user")
        .args(args)
        .output()
        .map_err(|error| format!("Failed to run systemctl --user: {error}"))?;
    ensure_command_succeeded(output, "Failed to configure systemd user timer")
}

#[cfg(target_os = "linux")]
fn systemd_quote(value: &str) -> String {
    format!("\"{}\"", value.replace('\\', "\\\\").replace('"', "\\\""))
}

#[cfg(target_os = "linux")]
fn linux_systemd_environment_lines() -> String {
    let mut lines = String::new();
    for key in [
        "DISPLAY",
        "WAYLAND_DISPLAY",
        "XDG_RUNTIME_DIR",
        "DBUS_SESSION_BUS_ADDRESS",
        "XAUTHORITY",
    ] {
        if let Ok(value) = std::env::var(key) {
            if !value.is_empty() {
                lines.push_str(&format!(
                    "Environment={}\n",
                    systemd_quote(&format!("{key}={value}"))
                ));
            }
        }
    }
    lines
}

#[cfg(target_os = "linux")]
fn read_linux_crontab() -> Result<String, String> {
    let output = Command::new("crontab")
        .arg("-l")
        .output()
        .map_err(|error| format!("Failed to read crontab: {error}"))?;
    if output.status.success() {
        return Ok(String::from_utf8_lossy(&output.stdout).into_owned());
    }
    if output.status.code() == Some(1) {
        return Ok(String::new());
    }
    Err(command_output_message(&output, "Failed to read crontab"))
}

#[cfg(target_os = "linux")]
fn filter_linux_crontab(contents: &str, id: &str) -> String {
    let marker = format!("{CRON_MARKER_PREFIX}{id}");
    let mut result = String::new();
    let mut skip = false;
    for line in contents.lines() {
        if skip {
            skip = false;
            continue;
        }
        if line.trim() == marker {
            skip = true;
            continue;
        }
        result.push_str(line);
        result.push('\n');
    }
    result
}

#[cfg(target_os = "linux")]
fn write_linux_crontab(contents: &str) -> Result<(), String> {
    let path = temporary_path("agent-one-cron");
    fs::write(&path, contents)
        .map_err(|error| format!("Failed to write temporary crontab: {error}"))?;
    let output = Command::new("crontab")
        .arg(&path)
        .output()
        .map_err(|error| format!("Failed to install crontab: {error}"));
    let _ = fs::remove_file(path);
    ensure_command_succeeded(output?, "Failed to install crontab")
}

#[cfg(target_os = "linux")]
fn shell_quote(value: &str) -> String {
    format!("'{}'", value.replace('\'', "'\"'\"'"))
}

#[cfg(target_os = "linux")]
fn linux_cron_environment_prefix() -> String {
    let mut prefix = String::new();
    for key in [
        "DISPLAY",
        "WAYLAND_DISPLAY",
        "XDG_RUNTIME_DIR",
        "DBUS_SESSION_BUS_ADDRESS",
        "XAUTHORITY",
    ] {
        if let Ok(value) = std::env::var(key) {
            if !value.is_empty() {
                prefix.push_str(&format!("{key}={} ", shell_quote(&value)));
            }
        }
    }
    prefix
}

#[cfg(target_os = "macos")]
fn install_macos_cron(cron: &Cron) -> Result<(), String> {
    let parsed = ParsedCron::parse(&cron.schedule)?;
    let path = macos_plist_path(&cron.id)?;
    fs::create_dir_all(
        path.parent()
            .ok_or("Failed to resolve LaunchAgents directory")?,
    )
    .map_err(|error| format!("Failed to create LaunchAgents directory: {error}"))?;
    let label = format!("{CRON_LABEL_PREFIX}.{}", cron.id);
    let intervals = macos_calendar_intervals(&parsed);
    let plist = format!(
        "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<!DOCTYPE plist PUBLIC \"-//Apple//DTD PLIST 1.0//EN\" \"http://www.apple.com/DTDs/PropertyList-1.0.dtd\">\n<plist version=\"1.0\">\n<dict>\n  <key>Label</key><string>{label}</string>\n  <key>ProgramArguments</key><array><string>{}</string><string>{}</string></array>\n  <key>StartCalendarInterval</key>{intervals}\n</dict>\n</plist>\n",
        xml_escape(&resolve_executable_path()?.to_string_lossy()),
        xml_escape(&cron_url(&cron.id)),
    );
    fs::write(&path, plist).map_err(|error| format!("Failed to write launch agent: {error}"))?;
    let domain = format!("gui/{}", macos_uid()?);
    let _ = Command::new("/bin/launchctl")
        .args(["bootout", &format!("{domain}/{label}")])
        .output();
    let output = Command::new("/bin/launchctl")
        .arg("bootstrap")
        .arg(domain)
        .arg(path)
        .output()
        .map_err(|error| format!("Failed to run launchctl: {error}"))?;
    ensure_command_succeeded(output, "Failed to install launch agent")
}

#[cfg(target_os = "macos")]
fn remove_macos_cron(id: &str) -> Result<(), String> {
    let label = format!("{CRON_LABEL_PREFIX}.{id}");
    let domain = format!("gui/{}", macos_uid()?);
    let _ = Command::new("/bin/launchctl")
        .args(["bootout", &format!("{domain}/{label}")])
        .output();
    let path = macos_plist_path(id)?;
    if path.exists() {
        fs::remove_file(path).map_err(|error| format!("Failed to remove launch agent: {error}"))?;
    }
    Ok(())
}

#[cfg(target_os = "macos")]
fn macos_plist_path(id: &str) -> Result<PathBuf, String> {
    let home = std::env::var("HOME").map_err(|error| format!("Failed to resolve HOME: {error}"))?;
    Ok(PathBuf::from(home)
        .join("Library/LaunchAgents")
        .join(format!("{CRON_LABEL_PREFIX}.{id}.plist")))
}

#[cfg(target_os = "macos")]
fn macos_uid() -> Result<String, String> {
    let output = Command::new("id")
        .arg("-u")
        .output()
        .map_err(|error| format!("Failed to resolve user ID: {error}"))?;
    ensure_command_succeeded_ref(&output, "Failed to resolve user ID")?;
    Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
}

#[cfg(target_os = "macos")]
fn macos_calendar_intervals(cron: &ParsedCron) -> String {
    let mut dictionaries = Vec::new();
    if !cron.day.wildcard && !cron.weekday.wildcard {
        append_macos_dictionaries(cron, false, true, &mut dictionaries);
        append_macos_dictionaries(cron, true, false, &mut dictionaries);
    } else {
        append_macos_dictionaries(cron, true, true, &mut dictionaries);
    }
    format!("<array>{}</array>", dictionaries.join(""))
}

#[cfg(target_os = "macos")]
fn append_macos_dictionaries(
    cron: &ParsedCron,
    include_day: bool,
    include_weekday: bool,
    output: &mut Vec<String>,
) {
    let days = optional_values(&cron.day, include_day);
    let months = optional_values(&cron.month, true);
    let weekdays = optional_values(&cron.weekday, include_weekday);
    for minute in &cron.minute.values {
        for hour in &cron.hour.values {
            for day in &days {
                for month in &months {
                    for weekday in &weekdays {
                        let mut dict = format!(
                            "<dict><key>Minute</key><integer>{minute}</integer><key>Hour</key><integer>{hour}</integer>"
                        );
                        if let Some(day) = day {
                            dict.push_str(&format!("<key>Day</key><integer>{day}</integer>"));
                        }
                        if let Some(month) = month {
                            dict.push_str(&format!("<key>Month</key><integer>{month}</integer>"));
                        }
                        if let Some(weekday) = weekday {
                            dict.push_str(&format!(
                                "<key>Weekday</key><integer>{}</integer>",
                                weekday + 1
                            ));
                        }
                        dict.push_str("</dict>");
                        output.push(dict);
                    }
                }
            }
        }
    }
}

#[cfg(target_os = "macos")]
fn optional_values(field: &CronField, include: bool) -> Vec<Option<u8>> {
    if !include || field.wildcard {
        vec![None]
    } else {
        field.values.iter().copied().map(Some).collect()
    }
}

#[cfg(target_os = "windows")]
fn install_windows_cron(cron: &Cron) -> Result<(), String> {
    let parsed = ParsedCron::parse(&cron.schedule)?;
    let xml = windows_task_xml(cron, &parsed)?;
    let path = temporary_path("agent-one-cron.xml");
    fs::write(&path, xml).map_err(|error| format!("Failed to write task XML: {error}"))?;
    let task_name = format!("{CRON_TASK_PREFIX}-{}", cron.id);
    let output = Command::new("schtasks")
        .args(["/create", "/xml"])
        .arg(&path)
        .args(["/tn", &task_name, "/f"])
        .output()
        .map_err(|error| format!("Failed to run schtasks: {error}"));
    let _ = fs::remove_file(path);
    ensure_command_succeeded(output?, "Failed to install scheduled task")
}

#[cfg(target_os = "windows")]
fn remove_windows_cron(id: &str) -> Result<(), String> {
    let task_name = format!("{CRON_TASK_PREFIX}-{id}");
    let query = Command::new("schtasks")
        .args(["/query", "/tn", &task_name])
        .output()
        .map_err(|error| format!("Failed to query scheduled task: {error}"))?;
    if !query.status.success() {
        return Ok(());
    }
    let output = Command::new("schtasks")
        .args(["/delete", "/tn", &task_name, "/f"])
        .output()
        .map_err(|error| format!("Failed to run schtasks: {error}"))?;
    ensure_command_succeeded(output, "Failed to remove scheduled task")
}

#[cfg(target_os = "windows")]
fn windows_task_xml(cron: &Cron, parsed: &ParsedCron) -> Result<String, String> {
    let mut triggers = String::new();
    if let Some((minute, hour, interval)) = windows_repetition(parsed) {
        triggers.push_str(&format!(
            "<CalendarTrigger><StartBoundary>2000-01-01T{hour:02}:{minute:02}:00</StartBoundary><Repetition><Interval>{interval}</Interval></Repetition><ScheduleByDay><DaysInterval>1</DaysInterval></ScheduleByDay></CalendarTrigger>"
        ));
    } else {
        let multiplier = if !parsed.day.wildcard && !parsed.weekday.wildcard {
            2
        } else {
            1
        };
        if parsed.minute.values.len() * parsed.hour.values.len() * multiplier > 48 {
            return Err(
                "This cron requires more than 48 Windows Task Scheduler triggers".to_string(),
            );
        }
        for hour in &parsed.hour.values {
            for minute in &parsed.minute.values {
                let boundary = format!("2000-01-01T{hour:02}:{minute:02}:00");
                if !parsed.day.wildcard {
                    triggers.push_str(&windows_month_trigger(&boundary, parsed, false));
                }
                if !parsed.weekday.wildcard {
                    triggers.push_str(&windows_weekday_trigger(&boundary, parsed));
                }
                if parsed.day.wildcard && parsed.weekday.wildcard {
                    if parsed.month.wildcard {
                        triggers.push_str(&format!("<CalendarTrigger><StartBoundary>{boundary}</StartBoundary><ScheduleByDay><DaysInterval>1</DaysInterval></ScheduleByDay></CalendarTrigger>"));
                    } else {
                        triggers.push_str(&windows_month_trigger(&boundary, parsed, true));
                    }
                }
            }
        }
    }
    Ok(format!(
        "<?xml version=\"1.0\" encoding=\"UTF-16\"?><Task version=\"1.2\" xmlns=\"http://schemas.microsoft.com/windows/2004/02/mit/task\"><Triggers>{triggers}</Triggers><Principals><Principal id=\"Author\"><LogonType>InteractiveToken</LogonType><RunLevel>LeastPrivilege</RunLevel></Principal></Principals><Settings><MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy><StartWhenAvailable>true</StartWhenAvailable><Enabled>true</Enabled></Settings><Actions Context=\"Author\"><Exec><Command>{}</Command><Arguments>{}</Arguments></Exec></Actions></Task>",
        xml_escape(&resolve_executable_path()?.to_string_lossy()),
        xml_escape(&cron_url(&cron.id)),
    ))
}

#[cfg(target_os = "windows")]
fn windows_repetition(parsed: &ParsedCron) -> Option<(u8, u8, String)> {
    if !parsed.day.wildcard || !parsed.month.wildcard || !parsed.weekday.wildcard {
        return None;
    }
    if parsed.hour.values.len() == 24 {
        let step = evenly_spaced_step(&parsed.minute.values, 60)?;
        return Some((parsed.minute.values[0], 0, format!("PT{step}M")));
    }
    if parsed.minute.values.len() == 1 {
        let step = evenly_spaced_step(&parsed.hour.values, 24)?;
        return Some((
            parsed.minute.values[0],
            parsed.hour.values[0],
            format!("PT{step}H"),
        ));
    }
    None
}

#[cfg(target_os = "windows")]
fn evenly_spaced_step(values: &[u8], period: u8) -> Option<u8> {
    if values.is_empty() {
        return None;
    }
    let step = if values.len() == 1 {
        period
    } else {
        values[1] - values[0]
    };
    (step > 0
        && period % step == 0
        && values.len() == usize::from(period / step)
        && values.windows(2).all(|pair| pair[1] - pair[0] == step))
    .then_some(step)
}

#[cfg(target_os = "windows")]
fn windows_month_trigger(boundary: &str, parsed: &ParsedCron, all_days: bool) -> String {
    let days = if all_days {
        (1..=31).collect::<Vec<_>>()
    } else {
        parsed.day.values.clone()
    };
    format!(
        "<CalendarTrigger><StartBoundary>{boundary}</StartBoundary><ScheduleByMonth><DaysOfMonth>{}</DaysOfMonth><Months>{}</Months></ScheduleByMonth></CalendarTrigger>",
        days.iter().map(|day| format!("<Day>{day}</Day>")).collect::<String>(),
        windows_months(&parsed.month),
    )
}

#[cfg(target_os = "windows")]
fn windows_weekday_trigger(boundary: &str, parsed: &ParsedCron) -> String {
    let weekdays = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
    ];
    let days = parsed
        .weekday
        .values
        .iter()
        .map(|day| format!("<{} />", weekdays[usize::from(*day)]))
        .collect::<String>();
    if parsed.month.wildcard {
        format!("<CalendarTrigger><StartBoundary>{boundary}</StartBoundary><ScheduleByWeek><WeeksInterval>1</WeeksInterval><DaysOfWeek>{days}</DaysOfWeek></ScheduleByWeek></CalendarTrigger>")
    } else {
        format!("<CalendarTrigger><StartBoundary>{boundary}</StartBoundary><ScheduleByMonthDayOfWeek><Weeks><Week>1</Week><Week>2</Week><Week>3</Week><Week>4</Week><Week>Last</Week></Weeks><DaysOfWeek>{days}</DaysOfWeek><Months>{}</Months></ScheduleByMonthDayOfWeek></CalendarTrigger>", windows_months(&parsed.month))
    }
}

#[cfg(target_os = "windows")]
fn windows_months(field: &CronField) -> String {
    let names = [
        "",
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ];
    let values = if field.wildcard {
        (1..=12).collect::<Vec<_>>()
    } else {
        field.values.clone()
    };
    values
        .iter()
        .map(|month| format!("<{} />", names[usize::from(*month)]))
        .collect()
}

#[cfg(any(target_os = "macos", target_os = "windows"))]
fn xml_escape(value: &str) -> String {
    value
        .replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&apos;")
}

#[cfg(any(target_os = "linux", target_os = "windows"))]
fn temporary_path(prefix: &str) -> PathBuf {
    std::env::temp_dir().join(format!("{prefix}-{}.tmp", Uuid::new_v4()))
}

#[cfg(target_os = "linux")]
fn command_exists(name: &str) -> bool {
    std::env::var_os("PATH").is_some_and(|path| {
        std::env::split_paths(&path).any(|directory| directory.join(name).is_file())
    })
}

fn ensure_command_succeeded(output: std::process::Output, context: &str) -> Result<(), String> {
    ensure_command_succeeded_ref(&output, context)
}

fn ensure_command_succeeded_ref(
    output: &std::process::Output,
    context: &str,
) -> Result<(), String> {
    if output.status.success() {
        Ok(())
    } else {
        Err(command_output_message(output, context))
    }
}

fn command_output_message(output: &std::process::Output, context: &str) -> String {
    let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
    let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
    if !stderr.is_empty() {
        format!("{context}: {stderr}")
    } else if !stdout.is_empty() {
        format!("{context}: {stdout}")
    } else {
        format!("{context}: process exited with {}", output.status)
    }
}
