// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
mod tools;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {name}! You've been greeted from Rust!")
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, tools::get_url_content])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
