#![cfg(target_os = "linux")]

use std::sync::{Arc, Mutex};

use notify_rust::{Hint, NotificationHandle};
use tauri::State;

pub struct NotificationState {
    pub appname: String,
    pub handles: Arc<Mutex<Vec<NotificationHandle>>>,
}

#[tauri::command]
pub fn send_notification(
    state: State<'_, NotificationState>,
    title: String,
    body: String,
) -> Result<(), String> {
    let appname = state.appname.clone();
    let handles = Arc::clone(&state.handles);

    tauri::async_runtime::spawn(async move {
        let mut notification = notify_rust::Notification::new();
        notification
            .appname(&appname)
            .summary(&title)
            .body(&body)
            .auto_icon()
            .hint(Hint::DesktopEntry(appname));

        let handle = match notification.show() {
            Ok(handle) => handle,
            Err(error) => {
                eprintln!("Failed to send notification: {error}");
                return;
            }
        };
        if let Ok(mut handles) = handles.lock() {
            handles.push(handle);
        }
    });

    Ok(())
}
