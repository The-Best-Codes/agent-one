use std::collections::HashMap;
use std::sync::Mutex;

use serde::Serialize;
use tauri::{Manager, State, Window, WindowEvent};

struct WindowChatEntry {
    chat_id: String,
    owner_token: String,
}

#[derive(Default)]
pub struct WindowChatState(Mutex<HashMap<String, WindowChatEntry>>);

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ChatOpenStatus {
    pub other_window_count: usize,
    pub opened_here: bool,
}

fn with_window_chats<T>(
    state: &State<'_, WindowChatState>,
    f: impl FnOnce(&mut HashMap<String, WindowChatEntry>) -> T,
) -> Result<T, String> {
    let mut chats = state
        .0
        .lock()
        .map_err(|error| format!("failed to lock window chat state: {error}"))?;
    Ok(f(&mut chats))
}

pub fn handle_window_event(window: &Window, event: &WindowEvent) {
    if !matches!(event, WindowEvent::Destroyed) {
        return;
    }

    let state = window.app_handle().state::<WindowChatState>();
    let lock = state.0.lock();
    if let Ok(mut chats) = lock {
        chats.remove(window.label());
    };
}

#[tauri::command]
pub fn check_chat_open_elsewhere(
    window: Window,
    chat_id: String,
    state: State<'_, WindowChatState>,
) -> Result<usize, String> {
    let app = window.app_handle();
    let window_label = window.label().to_string();

    with_window_chats(&state, |chats| {
        chats.retain(|label, _| app.get_webview_window(label).is_some());

        chats
            .iter()
            .filter(|(label, entry)| {
                label.as_str() != window_label.as_str() && entry.chat_id == chat_id
            })
            .count()
    })
}

#[tauri::command]
pub fn sync_current_window_chat(
    window: Window,
    chat_id: Option<String>,
    owner_token: String,
    force: bool,
    state: State<'_, WindowChatState>,
) -> Result<ChatOpenStatus, String> {
    let app = window.app_handle();
    let window_label = window.label().to_string();

    with_window_chats(&state, |chats| {
        chats.retain(|label, _| app.get_webview_window(label).is_some());

        let Some(chat_id) = chat_id else {
            if chats
                .get(&window_label)
                .is_some_and(|entry| entry.owner_token == owner_token)
            {
                chats.remove(&window_label);
            }
            return ChatOpenStatus {
                other_window_count: 0,
                opened_here: false,
            };
        };

        let other_window_count = chats
            .iter()
            .filter(|(label, current_chat_id)| {
                label.as_str() != window.label() && current_chat_id.chat_id == chat_id
            })
            .count();

        let already_open_here = chats
            .get(&window_label)
            .is_some_and(|entry| entry.chat_id == chat_id);

        if force || other_window_count == 0 || already_open_here {
            chats.insert(
                window_label,
                WindowChatEntry {
                    chat_id,
                    owner_token,
                },
            );
            ChatOpenStatus {
                other_window_count,
                opened_here: true,
            }
        } else {
            chats.remove(&window_label);
            ChatOpenStatus {
                other_window_count,
                opened_here: false,
            }
        }
    })
}
