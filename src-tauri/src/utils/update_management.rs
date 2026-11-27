use std::{env, path::Path};

const EXTERNAL_UPDATE_MARKER_PATH: &str = "/usr/lib/agent-one/updates-managed-externally";
const EXTERNAL_UPDATE_ENV_VARS: &[&str] = &["SNAP", "SNAP_NAME", "FLATPAK_ID"];
const FLATPAK_INFO_PATH: &str = "/.flatpak-info";

#[cfg(target_os = "windows")]
fn is_microsoft_store_install() -> bool {
    use std::ptr::null_mut;
    use windows_sys::Win32::Foundation::ERROR_INSUFFICIENT_BUFFER;
    use windows_sys::Win32::Storage::Packaging::Appx::{
        GetCurrentPackageFullName, GetStagedPackageOrigin, PackageOrigin_Store,
    };

    let mut full_name_len: u32 = 0;

    let rc = unsafe { GetCurrentPackageFullName(&mut full_name_len, null_mut()) };
    if rc != ERROR_INSUFFICIENT_BUFFER {
        return false;
    }

    let mut full_name = vec![0u16; full_name_len as usize];
    let rc = unsafe { GetCurrentPackageFullName(&mut full_name_len, full_name.as_mut_ptr()) };
    if rc != 0 {
        return false;
    }

    let mut origin: i32 = 0;
    let rc = unsafe { GetStagedPackageOrigin(full_name.as_ptr(), &mut origin) };
    rc == 0 && origin == PackageOrigin_Store
}

#[cfg(not(target_os = "windows"))]
fn is_microsoft_store_install() -> bool {
    false
}

#[tauri::command]
pub fn is_update_managed_externally() -> bool {
    EXTERNAL_UPDATE_ENV_VARS
        .iter()
        .any(|name| env::var_os(name).is_some())
        || Path::new(FLATPAK_INFO_PATH).exists()
        || Path::new(EXTERNAL_UPDATE_MARKER_PATH).exists()
        || is_microsoft_store_install()
}

#[cfg(target_os = "macos")]
fn can_install_update_without_prompt() -> bool {
    use std::os::unix::fs::{MetadataExt, PermissionsExt};

    let Ok(exe) = env::current_exe() else {
        return false;
    };
    let Some(app) = exe
        .ancestors()
        .find(|p| p.extension().is_some_and(|e| e == "app"))
    else {
        return false;
    };
    let Some(parent) = app.parent() else {
        return false;
    };
    let Ok(probe) = tempfile::NamedTempFile::new_in(parent) else {
        return false;
    };
    let (Ok(probe_meta), Ok(app_meta)) =
        (probe.as_file().metadata(), std::fs::symlink_metadata(app))
    else {
        return false;
    };
    app_meta.uid() == probe_meta.uid() && app_meta.permissions().mode() & 0o200 != 0
}

#[cfg(target_os = "linux")]
fn can_install_update_without_prompt() -> bool {
    use tauri::utils::{config::BundleType, platform::bundle_type};

    !matches!(bundle_type(), Some(BundleType::Deb | BundleType::Rpm))
}

#[cfg(not(any(target_os = "macos", target_os = "linux")))]
fn can_install_update_without_prompt() -> bool {
    false
}

#[tauri::command]
pub fn can_install_update_in_background() -> bool {
    can_install_update_without_prompt()
}
