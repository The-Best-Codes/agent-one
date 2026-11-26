#[tauri::command]
pub fn device_display_name() -> String {
    whoami::devicename()
        .or_else(|_| whoami::hostname())
        .map(|name| name.trim().to_string())
        .ok()
        .filter(|name| !name.is_empty() && !name.eq_ignore_ascii_case("localhost"))
        .unwrap_or_else(|| "My device".to_string())
}
