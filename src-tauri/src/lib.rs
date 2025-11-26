use std::sync::atomic::{AtomicU64, Ordering};

mod tools;
mod utils;

// Global counter for unique window IDs
static WINDOW_COUNTER: AtomicU64 = AtomicU64::new(0);

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_single_instance::init(|app, args, cwd| {
            println!("New instance started, args: {:?}, cwd: {:?}", args, cwd);

            // Generate a unique window ID using atomic counter
            let window_id = WINDOW_COUNTER.fetch_add(1, Ordering::SeqCst);
            let window_label = format!("a1-instance-{}", window_id);

            match tauri::WebviewWindowBuilder::new(
                app,
                &window_label,
                tauri::WebviewUrl::App("index.html".into()),
            )
            .title("AgentOne")
            .inner_size(800.0, 600.0)
            .build()
            {
                Ok(_) => println!("Created new window: {}", window_label),
                Err(e) => eprintln!("Failed to create new window: {}", e),
            }
        }))
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        // .plugin(tauri_plugin_log::Builder::new().build()) // Disabled for now
        .invoke_handler(tauri::generate_handler![
            tools::get_url_content,
            tools::web_search,
            utils::webview_html_callback,
            utils::list_webviews,
            utils::force_close_webview,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
