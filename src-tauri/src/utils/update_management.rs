use std::{env, path::Path};

const EXTERNAL_UPDATE_MARKER_PATH: &str = "/usr/lib/agent-one/updates-managed-externally";
const EXTERNAL_UPDATE_ENV_VARS: &[&str] =
    &["SNAP", "SNAP_NAME", "FLATPAK_ID", "PACKAGE_FAMILY_NAME"];
const FLATPAK_INFO_PATH: &str = "/.flatpak-info";

#[tauri::command]
pub fn is_update_managed_externally() -> bool {
    EXTERNAL_UPDATE_ENV_VARS
        .iter()
        .any(|name| env::var_os(name).is_some())
        || Path::new(FLATPAK_INFO_PATH).exists()
        || Path::new(EXTERNAL_UPDATE_MARKER_PATH).exists()
}
