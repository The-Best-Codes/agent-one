use std::{env, path::Path};

const EXTERNAL_UPDATE_MARKER_PATH: &str = "/usr/lib/agent-one/updates-managed-externally";
const EXTERNAL_UPDATE_ENV_VARS: &[&str] = &["SNAP", "SNAP_NAME", "FLATPAK_ID"];

#[tauri::command]
pub fn is_update_managed_externally() -> bool {
    EXTERNAL_UPDATE_ENV_VARS
        .iter()
        .any(|name| env::var_os(name).is_some())
        || Path::new(EXTERNAL_UPDATE_MARKER_PATH).exists()
}
