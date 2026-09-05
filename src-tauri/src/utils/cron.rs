use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::process::Command;
use tauri::Manager;

#[cfg(target_os = "macos")]
const LAUNCH_CRON_LABEL: &str = "dev.agent-one.launch-cron";
#[cfg(target_os = "linux")]
const LAUNCH_CRON_MARKER: &str = "# agent-one-launch-cron";
#[cfg(target_os = "linux")]
const LAUNCH_SYSTEMD_SERVICE_NAME: &str = "agent-one-launch-cron.service";
#[cfg(target_os = "linux")]
const LAUNCH_SYSTEMD_TIMER_NAME: &str = "agent-one-launch-cron.timer";
#[cfg(target_os = "windows")]
const LAUNCH_CRON_WINDOWS_TASK_NAME: &str = "AgentOneLaunchCron";
const LAUNCH_CRON_STATE_FILE_NAME: &str = "launch-cron.json";

#[derive(Serialize, Deserialize)]
struct StoredLaunchCron {
    time: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LaunchCronState {
    pub enabled: bool,
    pub time: Option<String>,
}

#[tauri::command]
pub fn get_launch_cron(app: tauri::AppHandle) -> Result<LaunchCronState, String> {
    match read_stored_launch_cron(&app)? {
        Some(schedule) => Ok(LaunchCronState {
            enabled: true,
            time: Some(schedule.time),
        }),
        None => Ok(LaunchCronState {
            enabled: false,
            time: None,
        }),
    }
}

#[tauri::command]
pub fn set_launch_cron(app: tauri::AppHandle, time: String) -> Result<LaunchCronState, String> {
    let normalized_time = normalize_time(&time)?;

    remove_launch_cron_for_platform()?;
    install_launch_cron_for_platform(&normalized_time)?;
    write_stored_launch_cron(
        &app,
        &StoredLaunchCron {
            time: normalized_time.clone(),
        },
    )?;

    Ok(LaunchCronState {
        enabled: true,
        time: Some(normalized_time),
    })
}

#[tauri::command]
pub fn clear_launch_cron(app: tauri::AppHandle) -> Result<LaunchCronState, String> {
    remove_launch_cron_for_platform()?;
    remove_stored_launch_cron(&app)?;

    Ok(LaunchCronState {
        enabled: false,
        time: None,
    })
}

fn normalize_time(value: &str) -> Result<String, String> {
    let Some((hour_text, minute_text)) = value.split_once(':') else {
        return Err("Time must use HH:MM format".to_string());
    };

    if hour_text.len() != 2
        || minute_text.len() != 2
        || !hour_text.chars().all(|char| char.is_ascii_digit())
        || !minute_text.chars().all(|char| char.is_ascii_digit())
    {
        return Err("Time must use HH:MM format".to_string());
    }

    let hour = hour_text
        .parse::<u8>()
        .map_err(|_| "Invalid hour in launch time".to_string())?;
    let minute = minute_text
        .parse::<u8>()
        .map_err(|_| "Invalid minute in launch time".to_string())?;

    if hour > 23 || minute > 59 {
        return Err("Launch time must be between 00:00 and 23:59".to_string());
    }

    Ok(format!("{hour:02}:{minute:02}"))
}

fn resolve_launch_cron_state_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let app_config_dir = app
        .path()
        .app_config_dir()
        .map_err(|error| format!("Failed to resolve app config directory: {error}"))?;

    fs::create_dir_all(&app_config_dir)
        .map_err(|error| format!("Failed to create app config directory: {error}"))?;

    Ok(app_config_dir.join(LAUNCH_CRON_STATE_FILE_NAME))
}

fn read_stored_launch_cron(app: &tauri::AppHandle) -> Result<Option<StoredLaunchCron>, String> {
    let state_path = resolve_launch_cron_state_path(app)?;
    if !state_path.exists() {
        return Ok(None);
    }

    let contents = fs::read_to_string(&state_path)
        .map_err(|error| format!("Failed to read launch schedule: {error}"))?;
    let schedule: StoredLaunchCron = serde_json::from_str(&contents)
        .map_err(|error| format!("Failed to parse launch schedule: {error}"))?;

    Ok(Some(StoredLaunchCron {
        time: normalize_time(&schedule.time)?,
    }))
}

fn write_stored_launch_cron(
    app: &tauri::AppHandle,
    schedule: &StoredLaunchCron,
) -> Result<(), String> {
    let state_path = resolve_launch_cron_state_path(app)?;
    let contents = serde_json::to_string_pretty(schedule)
        .map_err(|error| format!("Failed to serialize launch schedule: {error}"))?;

    fs::write(state_path, contents)
        .map_err(|error| format!("Failed to save launch schedule: {error}"))
}

fn remove_stored_launch_cron(app: &tauri::AppHandle) -> Result<(), String> {
    let state_path = resolve_launch_cron_state_path(app)?;
    if !state_path.exists() {
        return Ok(());
    }

    fs::remove_file(state_path)
        .map_err(|error| format!("Failed to remove launch schedule: {error}"))
}

fn resolve_executable_path() -> Result<PathBuf, String> {
    std::env::current_exe().map_err(|error| format!("Failed to resolve app executable: {error}"))
}

fn install_launch_cron_for_platform(time: &str) -> Result<(), String> {
    #[cfg(target_os = "linux")]
    {
        return install_linux_launch_cron(time);
    }

    #[cfg(target_os = "macos")]
    {
        return install_macos_launch_cron(time);
    }

    #[cfg(target_os = "windows")]
    {
        return install_windows_launch_cron(time);
    }

    #[allow(unreachable_code)]
    Err("Launch cron is not supported on this platform".to_string())
}

fn remove_launch_cron_for_platform() -> Result<(), String> {
    #[cfg(target_os = "linux")]
    {
        return remove_linux_launch_cron();
    }

    #[cfg(target_os = "macos")]
    {
        return remove_macos_launch_cron();
    }

    #[cfg(target_os = "windows")]
    {
        return remove_windows_launch_cron();
    }

    #[allow(unreachable_code)]
    Ok(())
}

#[cfg(target_os = "linux")]
fn install_linux_launch_cron(time: &str) -> Result<(), String> {
    if command_exists("systemctl") {
        match install_linux_systemd_launch_cron(time) {
            Ok(()) => return Ok(()),
            Err(error) if !command_exists("crontab") => return Err(error),
            Err(_) => {}
        }
    }

    if !command_exists("crontab") {
        return Err(
            "Automatic reopen is not available on this Linux system because neither systemd user timers nor crontab are available."
                .to_string(),
        );
    }

    install_linux_crontab_launch_cron(time)
}

#[cfg(target_os = "linux")]
fn remove_linux_launch_cron() -> Result<(), String> {
    let mut errors = Vec::new();

    if command_exists("systemctl") {
        if let Err(error) = remove_linux_systemd_launch_cron() {
            errors.push(error);
        }
    }

    if command_exists("crontab") {
        if let Err(error) = remove_linux_crontab_launch_cron() {
            errors.push(error);
        }
    }

    if errors.is_empty() {
        return Ok(());
    }

    Err(errors.join(" | "))
}

#[cfg(target_os = "linux")]
fn install_linux_crontab_launch_cron(time: &str) -> Result<(), String> {
    let executable_path = resolve_executable_path()?;
    let existing_crontab = read_linux_crontab()?;
    let filtered_crontab = filter_linux_crontab(&existing_crontab);
    let (hour, minute) = split_time(time)?;
    let escaped_executable_path =
        shell_quote(executable_path.as_os_str().to_string_lossy().as_ref());
    let environment_prefix = linux_cron_environment_prefix();
    let next_crontab = format!(
        "{filtered_crontab}{marker}\n{minute} {hour} * * * {environment_prefix}{escaped_executable_path}\n",
        marker = LAUNCH_CRON_MARKER,
    );

    let temp_path = create_temp_path("agent-one-launch-cron")?;
    fs::write(&temp_path, next_crontab)
        .map_err(|error| format!("Failed to write temporary crontab: {error}"))?;

    let result = Command::new("crontab")
        .arg(&temp_path)
        .output()
        .map_err(|error| format!("Failed to run crontab: {error}"));

    let cleanup_result = fs::remove_file(&temp_path);
    if let Err(error) = cleanup_result {
        if error.kind() != std::io::ErrorKind::NotFound {
            return Err(format!("Failed to clean up temporary crontab: {error}"));
        }
    }

    let output = result?;
    ensure_command_succeeded(output, "Failed to install launch crontab")
}

#[cfg(target_os = "linux")]
fn remove_linux_crontab_launch_cron() -> Result<(), String> {
    let existing_crontab = read_linux_crontab()?;
    let filtered_crontab = filter_linux_crontab(&existing_crontab);
    let temp_path = create_temp_path("agent-one-launch-cron-remove")?;

    fs::write(&temp_path, filtered_crontab)
        .map_err(|error| format!("Failed to write temporary crontab: {error}"))?;

    let result = Command::new("crontab")
        .arg(&temp_path)
        .output()
        .map_err(|error| format!("Failed to run crontab: {error}"));

    let cleanup_result = fs::remove_file(&temp_path);
    if let Err(error) = cleanup_result {
        if error.kind() != std::io::ErrorKind::NotFound {
            return Err(format!("Failed to clean up temporary crontab: {error}"));
        }
    }

    let output = result?;
    ensure_command_succeeded(output, "Failed to remove launch crontab")
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
fn filter_linux_crontab(contents: &str) -> String {
    let mut result = String::new();
    let mut skip_next_line = false;

    for line in contents.lines() {
        if skip_next_line {
            skip_next_line = false;
            continue;
        }

        if line.trim() == LAUNCH_CRON_MARKER {
            skip_next_line = true;
            continue;
        }

        result.push_str(line);
        result.push('\n');
    }

    result
}

#[cfg(target_os = "linux")]
fn shell_quote(value: &str) -> String {
    format!("'{}'", value.replace('\'', "'\"'\"'"))
}

#[cfg(target_os = "linux")]
fn install_linux_systemd_launch_cron(time: &str) -> Result<(), String> {
    let executable_path = resolve_executable_path()?;
    let unit_directory = resolve_linux_systemd_user_dir()?;

    fs::create_dir_all(&unit_directory)
        .map_err(|error| format!("Failed to create systemd user directory: {error}"))?;

    let service_path = unit_directory.join(LAUNCH_SYSTEMD_SERVICE_NAME);
    let timer_path = unit_directory.join(LAUNCH_SYSTEMD_TIMER_NAME);
    let service_contents = format!(
        "[Unit]\nDescription=Launch AgentOne automatically\n\n[Service]\nType=oneshot\n{environment_lines}ExecStart={exec_start}\n",
        environment_lines = linux_systemd_environment_lines(),
        exec_start = systemd_quote(executable_path.as_os_str().to_string_lossy().as_ref()),
    );
    let timer_contents = format!(
        "[Unit]\nDescription=Launch AgentOne automatically every day\n\n[Timer]\nOnCalendar=*-*-* {time}:00\nPersistent=true\nUnit={service_name}\n\n[Install]\nWantedBy=timers.target\n",
        service_name = LAUNCH_SYSTEMD_SERVICE_NAME,
    );

    fs::write(&service_path, service_contents)
        .map_err(|error| format!("Failed to write systemd service: {error}"))?;
    fs::write(&timer_path, timer_contents)
        .map_err(|error| format!("Failed to write systemd timer: {error}"))?;

    run_systemctl_user(["daemon-reload"])?;
    run_systemctl_user(["enable", "--now", LAUNCH_SYSTEMD_TIMER_NAME])?;

    Ok(())
}

#[cfg(target_os = "linux")]
fn remove_linux_systemd_launch_cron() -> Result<(), String> {
    let unit_directory = resolve_linux_systemd_user_dir()?;
    let service_path = unit_directory.join(LAUNCH_SYSTEMD_SERVICE_NAME);
    let timer_path = unit_directory.join(LAUNCH_SYSTEMD_TIMER_NAME);

    let _ = run_systemctl_user(["disable", "--now", LAUNCH_SYSTEMD_TIMER_NAME]);

    if service_path.exists() {
        fs::remove_file(&service_path)
            .map_err(|error| format!("Failed to remove systemd service: {error}"))?;
    }

    if timer_path.exists() {
        fs::remove_file(&timer_path)
            .map_err(|error| format!("Failed to remove systemd timer: {error}"))?;
    }

    let _ = run_systemctl_user(["daemon-reload"]);

    Ok(())
}

#[cfg(target_os = "linux")]
fn resolve_linux_systemd_user_dir() -> Result<PathBuf, String> {
    let home_directory = std::env::var("HOME")
        .map_err(|error| format!("Failed to resolve HOME directory: {error}"))?;

    Ok(PathBuf::from(home_directory)
        .join(".config")
        .join("systemd")
        .join("user"))
}

#[cfg(target_os = "linux")]
fn linux_cron_environment_prefix() -> String {
    const ENVIRONMENT_KEYS: [&str; 5] = [
        "DISPLAY",
        "WAYLAND_DISPLAY",
        "XDG_RUNTIME_DIR",
        "DBUS_SESSION_BUS_ADDRESS",
        "XAUTHORITY",
    ];

    let mut prefix = String::new();

    for key in ENVIRONMENT_KEYS {
        if let Ok(value) = std::env::var(key) {
            if value.is_empty() {
                continue;
            }

            prefix.push_str(key);
            prefix.push('=');
            prefix.push_str(&shell_quote(&value));
            prefix.push(' ');
        }
    }

    prefix
}

#[cfg(target_os = "linux")]
fn linux_systemd_environment_lines() -> String {
    const ENVIRONMENT_KEYS: [&str; 5] = [
        "DISPLAY",
        "WAYLAND_DISPLAY",
        "XDG_RUNTIME_DIR",
        "DBUS_SESSION_BUS_ADDRESS",
        "XAUTHORITY",
    ];

    let mut lines = String::new();

    for key in ENVIRONMENT_KEYS {
        if let Ok(value) = std::env::var(key) {
            if value.is_empty() {
                continue;
            }

            lines.push_str("Environment=");
            lines.push_str(&systemd_quote(&format!("{key}={value}")));
            lines.push('\n');
        }
    }

    lines
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

#[cfg(target_os = "macos")]
fn install_macos_launch_cron(time: &str) -> Result<(), String> {
    let executable_path = resolve_executable_path()?;
    let plist_path = resolve_macos_plist_path()?;
    let launch_agents_dir = plist_path
        .parent()
        .ok_or_else(|| "Failed to resolve LaunchAgents directory".to_string())?;
    fs::create_dir_all(launch_agents_dir)
        .map_err(|error| format!("Failed to create LaunchAgents directory: {error}"))?;

    let (hour, minute) = split_time(time)?;
    let executable = xml_escape(executable_path.as_os_str().to_string_lossy().as_ref());
    let plist = format!(
        "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<!DOCTYPE plist PUBLIC \"-//Apple//DTD PLIST 1.0//EN\" \"http://www.apple.com/DTDs/PropertyList-1.0.dtd\">\n<plist version=\"1.0\">\n<dict>\n  <key>Label</key>\n  <string>{label}</string>\n  <key>ProgramArguments</key>\n  <array>\n    <string>{executable}</string>\n  </array>\n  <key>RunAtLoad</key>\n  <false/>\n  <key>StartCalendarInterval</key>\n  <dict>\n    <key>Hour</key>\n    <integer>{hour}</integer>\n    <key>Minute</key>\n    <integer>{minute}</integer>\n  </dict>\n</dict>\n</plist>\n",
        label = LAUNCH_CRON_LABEL,
        executable = executable,
    );

    fs::write(&plist_path, plist)
        .map_err(|error| format!("Failed to write launch agent: {error}"))?;

    let domain = format!("gui/{}", current_macos_uid()?);
    let service_target = format!("{domain}/{LAUNCH_CRON_LABEL}");

    let _ = Command::new("/bin/launchctl")
        .arg("bootout")
        .arg(&service_target)
        .output();

    let output = Command::new("/bin/launchctl")
        .arg("bootstrap")
        .arg(&domain)
        .arg(&plist_path)
        .output()
        .map_err(|error| format!("Failed to run launchctl bootstrap: {error}"))?;

    ensure_command_succeeded(output, "Failed to install launch agent")
}

#[cfg(target_os = "macos")]
fn remove_macos_launch_cron() -> Result<(), String> {
    let plist_path = resolve_macos_plist_path()?;
    let domain = format!("gui/{}", current_macos_uid()?);
    let service_target = format!("{domain}/{LAUNCH_CRON_LABEL}");

    let _ = Command::new("/bin/launchctl")
        .arg("bootout")
        .arg(&service_target)
        .output();

    if plist_path.exists() {
        fs::remove_file(plist_path)
            .map_err(|error| format!("Failed to remove launch agent: {error}"))?;
    }

    Ok(())
}

#[cfg(target_os = "macos")]
fn resolve_macos_plist_path() -> Result<PathBuf, String> {
    let home_directory = std::env::var("HOME")
        .map_err(|error| format!("Failed to resolve HOME directory: {error}"))?;
    Ok(std::path::Path::new(&home_directory)
        .join("Library")
        .join("LaunchAgents")
        .join(format!("{LAUNCH_CRON_LABEL}.plist")))
}

#[cfg(target_os = "macos")]
fn current_macos_uid() -> Result<String, String> {
    let output = Command::new("id")
        .arg("-u")
        .output()
        .map_err(|error| format!("Failed to resolve current user id: {error}"))?;
    if !output.status.success() {
        return Err(command_output_message(
            &output,
            "Failed to resolve current user id",
        ));
    }

    let uid = String::from_utf8_lossy(&output.stdout).trim().to_string();

    if uid.is_empty() {
        return Err("Failed to resolve current user id".to_string());
    }

    Ok(uid)
}

#[cfg(target_os = "macos")]
fn xml_escape(value: &str) -> String {
    value
        .replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&apos;")
}

#[cfg(target_os = "windows")]
fn install_windows_launch_cron(time: &str) -> Result<(), String> {
    let executable_path = resolve_executable_path()?;
    let quoted_executable_path = format!("\"{}\"", executable_path.display());
    let output = Command::new("schtasks")
        .args([
            "/create",
            "/tn",
            LAUNCH_CRON_WINDOWS_TASK_NAME,
            "/sc",
            "daily",
            "/st",
            time,
            "/tr",
            &quoted_executable_path,
            "/f",
        ])
        .output()
        .map_err(|error| format!("Failed to run schtasks: {error}"))?;

    ensure_command_succeeded(output, "Failed to install Windows scheduled task")
}

#[cfg(target_os = "windows")]
fn remove_windows_launch_cron() -> Result<(), String> {
    let output = Command::new("schtasks")
        .args(["/delete", "/tn", LAUNCH_CRON_WINDOWS_TASK_NAME, "/f"])
        .output()
        .map_err(|error| format!("Failed to run schtasks: {error}"))?;

    if output.status.success() {
        return Ok(());
    }

    let stderr = String::from_utf8_lossy(&output.stderr).to_ascii_lowercase();
    let stdout = String::from_utf8_lossy(&output.stdout).to_ascii_lowercase();
    if stderr.contains("cannot find the file")
        || stderr.contains("does not exist")
        || stdout.contains("cannot find the file")
        || stdout.contains("does not exist")
    {
        return Ok(());
    }

    Err(command_output_message(
        &output,
        "Failed to remove Windows scheduled task",
    ))
}

fn split_time(time: &str) -> Result<(u8, u8), String> {
    let normalized_time = normalize_time(time)?;
    let (hour_text, minute_text) = normalized_time
        .split_once(':')
        .ok_or_else(|| "Time must use HH:MM format".to_string())?;

    let hour = hour_text
        .parse::<u8>()
        .map_err(|_| "Invalid hour in launch time".to_string())?;
    let minute = minute_text
        .parse::<u8>()
        .map_err(|_| "Invalid minute in launch time".to_string())?;

    Ok((hour, minute))
}

fn create_temp_path(prefix: &str) -> Result<PathBuf, String> {
    let random_suffix: u64 = rand::random();
    Ok(std::env::temp_dir().join(format!("{prefix}-{random_suffix}.tmp")))
}

fn command_exists(name: &str) -> bool {
    let Some(path) = std::env::var_os("PATH") else {
        return false;
    };

    for directory in std::env::split_paths(&path) {
        if directory.join(name).is_file() {
            return true;
        }
    }

    false
}

fn ensure_command_succeeded(output: std::process::Output, context: &str) -> Result<(), String> {
    if output.status.success() {
        return Ok(());
    }

    Err(command_output_message(&output, context))
}

fn command_output_message(output: &std::process::Output, context: &str) -> String {
    let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
    let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();

    if !stderr.is_empty() {
        return format!("{context}: {stderr}");
    }

    if !stdout.is_empty() {
        return format!("{context}: {stdout}");
    }

    format!("{context}: process exited with {}", output.status)
}
