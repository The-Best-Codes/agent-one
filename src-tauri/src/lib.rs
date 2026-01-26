use std::sync::atomic::{AtomicU64, Ordering};

use tauri::{Emitter, Manager};

mod keyring;
mod mcp_auth;
mod tools;
mod utils;

// Global counter for unique window IDs
static WINDOW_COUNTER: AtomicU64 = AtomicU64::new(0);

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default();

    // Single instance plugin should be the first plugin registered
    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(|app, args, _cwd| {
            println!("New instance started, args: {:?}", args);

            // Check if this was triggered by a deep link on Linux/Windows
            // Deep links are passed as argv when using the single-instance plugin with deep-link feature
            if args.len() > 1 {
                let deep_link = &args[1];
                if deep_link.starts_with("agent-one://") {
                    println!("Deep link detected: {}", deep_link);
                    if let Some(main_window) = app.get_webview_window("main") {
                        let _ = main_window.emit("tauri://deep-link", deep_link);
                        let _ = main_window.set_focus();
                    }
                    return;
                }
            }

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
        }));
    }

    let mut builder = builder
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_process::init());

    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    {
        builder = builder
            .plugin(tauri_plugin_updater::Builder::new().build())
            .plugin(tauri_plugin_window_state::Builder::new().build());
    }

    builder
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        // .plugin(tauri_plugin_log::Builder::new().build()) // Disabled for now
        .setup(|app| {
            use tauri_plugin_deep_link::DeepLinkExt;

            #[cfg(any(target_os = "linux", windows))]
            {
                // On Linux and Windows, register at runtime for development
                // can't do this on macOS: https://v2.tauri.app/plugin/deep-linking/
                if let Err(e) = app.deep_link().register_all() {
                    eprintln!("Failed to register deep link schemes: {}", e);
                }
            }

            app.deep_link().on_open_url(|event| {
                println!("Deep link opened: {:?}", event.urls());
            });

            app.manage(mcp_auth::AuthCancellationState(std::sync::Arc::new(
                tokio::sync::Mutex::new(std::collections::HashMap::new()),
            )));

            Ok(())
        })
        .invoke_handler({
            #[cfg(not(any(target_os = "android", target_os = "ios")))]
            {
                tauri::generate_handler![
                    tools::get_url_content,
                    tools::web_search,
                    utils::webview_html_callback,
                    utils::list_webviews,
                    utils::force_close_webview,
                    keyring::storage_get_item,
                    keyring::storage_set_item,
                    keyring::storage_remove_item,
                    keyring::storage_has_item,
                    mcp_auth::mcp_authenticate,
                    mcp_auth::mcp_cancel_auth,
                    mcp_auth::mcp_get_token,
                    mcp_auth::mcp_logout,
                ]
            }
            #[cfg(any(target_os = "android", target_os = "ios"))]
            {
                tauri::generate_handler![
                    tools::get_url_content,
                    tools::web_search,
                    keyring::storage_get_item,
                    keyring::storage_set_item,
                    keyring::storage_remove_item,
                    keyring::storage_has_item,
                    mcp_auth::mcp_authenticate,
                    mcp_auth::mcp_cancel_auth,
                    mcp_auth::mcp_get_token,
                    mcp_auth::mcp_logout,
                ]
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
