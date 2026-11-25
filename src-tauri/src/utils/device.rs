#[tauri::command]
pub fn device_display_name() -> String {
    let name = whoami::devicename();
    let name = name.trim();
    if name.is_empty() || name.eq_ignore_ascii_case("localhost") {
        "My device".to_string()
    } else {
        name.to_string()
    }
}
