use std::fs::{self, File};
use std::io::{self, Read, Seek};
use std::path::{Component, Path, PathBuf};
use std::sync::Mutex;

use serde::Serialize;
use sha2::{Digest, Sha256};
use tauri::{AppHandle, Emitter, Manager, Runtime, State};
use zip::ZipArchive;

const MANIFEST_NAME: &str = "manifest.json";
const MAX_MANIFEST_BYTES: u64 = 1024 * 1024;
const MAX_ENTRIES: usize = 200_000;
const MAX_UNPACKED_BYTES: u64 = 4 * 1024 * 1024 * 1024;
const MAX_SLUG_LEN: usize = 64;
const HASH_LEN: usize = 8;
const ID_PREFIX: &str = "mcpb:";
const OPENED_EVENT: &str = "mcpb-opened";

#[derive(Default)]
pub struct OpenedBundles(Mutex<Vec<String>>);

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BundleInfo {
    id: String,
    dir: String,
    manifest: serde_json::Value,
    manifest_hash: String,
}

fn is_bundle_path(path: &Path) -> bool {
    path.extension()
        .is_some_and(|ext| ext.eq_ignore_ascii_case("mcpb"))
        && path.is_file()
}

pub fn paths_from_args(args: &[String], cwd: &Path) -> Vec<PathBuf> {
    args.iter()
        .skip(1)
        .filter_map(|arg| match url::Url::parse(arg) {
            Ok(url) if url.scheme() == "file" => url.to_file_path().ok(),
            _ => Some(cwd.join(arg)),
        })
        .collect()
}

pub fn queue_opened<R: Runtime>(app: &AppHandle<R>, paths: impl IntoIterator<Item = PathBuf>) {
    let paths: Vec<String> = paths
        .into_iter()
        .filter(|path| is_bundle_path(path))
        .filter_map(|path| path.to_str().map(String::from))
        .collect();
    if paths.is_empty() {
        return;
    }
    if let Some(state) = app.try_state::<OpenedBundles>()
        && let Ok(mut opened) = state.0.lock()
    {
        opened.extend(paths);
    }
    let _ = app.emit(OPENED_EVENT, ());
}

fn slug_from_name(name: &str) -> String {
    let slug: String = name
        .trim()
        .to_lowercase()
        .chars()
        .map(|c| {
            if c.is_ascii_alphanumeric() || matches!(c, '-' | '_' | '.') {
                c
            } else {
                '-'
            }
        })
        .take(MAX_SLUG_LEN - HASH_LEN - 2)
        .collect();
    let slug = slug.trim_matches(|c| c == '-' || c == '.');
    if slug == name && !is_reserved_name(slug) {
        return slug.to_string();
    }
    let hash: String = Sha256::digest(name.as_bytes())
        .iter()
        .take(HASH_LEN / 2)
        .map(|byte| format!("{byte:02x}"))
        .collect();
    if slug.is_empty() {
        hash
    } else if is_reserved_name(slug) {
        format!("_{slug}-{hash}")
    } else {
        format!("{slug}-{hash}")
    }
}

fn is_reserved_name(slug: &str) -> bool {
    let stem = slug.split('.').next().unwrap_or_default();
    matches!(stem, "con" | "prn" | "aux" | "nul")
        || (stem.len() == 4
            && (stem.starts_with("com") || stem.starts_with("lpt"))
            && stem.as_bytes()[3].is_ascii_digit())
}

fn is_valid_slug(slug: &str) -> bool {
    !slug.is_empty()
        && !is_reserved_name(slug)
        && slug.len() <= MAX_SLUG_LEN
        && !slug.starts_with('.')
        && !slug.ends_with('.')
        && slug
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || matches!(c, '-' | '_' | '.'))
}

fn bundle_dir<R: Runtime>(app: &AppHandle<R>, id: &str) -> Result<PathBuf, String> {
    let slug = id
        .strip_prefix(ID_PREFIX)
        .filter(|slug| is_valid_slug(slug))
        .ok_or_else(|| format!("Invalid extension id: {id}"))?;
    let base = app
        .path()
        .app_local_data_dir()
        .map_err(|error| error.to_string())?;
    Ok(base.join("extensions").join(slug))
}

fn open_bundle(path: &str) -> Result<ZipArchive<File>, String> {
    let path = Path::new(path);
    if !is_bundle_path(path) {
        return Err("Choose an .mcpb file.".into());
    }
    let file = File::open(path).map_err(|error| error.to_string())?;
    ZipArchive::new(file).map_err(|error| format!("This file isn't a valid bundle: {error}"))
}

fn read_manifest<R: Read + Seek>(
    archive: &mut ZipArchive<R>,
) -> Result<(serde_json::Value, String), String> {
    let entry = archive
        .by_name(MANIFEST_NAME)
        .map_err(|_| "This bundle is missing its manifest.json file.".to_string())?;
    let mut bytes = Vec::new();
    entry
        .take(MAX_MANIFEST_BYTES + 1)
        .read_to_end(&mut bytes)
        .map_err(|error| error.to_string())?;
    if bytes.len() as u64 > MAX_MANIFEST_BYTES {
        return Err("This bundle's manifest.json file is too large.".into());
    }
    let manifest = serde_json::from_slice(&bytes)
        .map_err(|error| format!("Invalid manifest.json: {error}"))?;
    let hash = Sha256::digest(&bytes)
        .iter()
        .map(|byte| format!("{byte:02x}"))
        .collect();
    Ok((manifest, hash))
}

fn bundle_info<R: Runtime, F: Read + Seek>(
    app: &AppHandle<R>,
    archive: &mut ZipArchive<F>,
) -> Result<BundleInfo, String> {
    let (manifest, manifest_hash) = read_manifest(archive)?;
    let name = manifest
        .get("name")
        .and_then(|name| name.as_str())
        .ok_or("This bundle's manifest.json file is missing a name.")?;
    let id = format!("{ID_PREFIX}{}", slug_from_name(name));
    let dir = bundle_dir(app, &id)?;
    let dir = dir
        .to_str()
        .ok_or("The extension folder path isn't valid.")?
        .to_string();
    Ok(BundleInfo {
        id,
        dir,
        manifest,
        manifest_hash,
    })
}

fn extract<R: Read + Seek>(archive: &mut ZipArchive<R>, dest: &Path) -> Result<(), String> {
    if archive.len() > MAX_ENTRIES {
        return Err("This bundle has too many files.".into());
    }
    fs::create_dir_all(dest).map_err(|error| error.to_string())?;
    let mut total: u64 = 0;
    for index in 0..archive.len() {
        let mut entry = archive.by_index(index).map_err(|error| error.to_string())?;
        if entry.is_symlink() {
            continue;
        }
        let relative = entry
            .enclosed_name()
            .filter(|path| {
                path.components()
                    .all(|part| matches!(part, Component::Normal(_) | Component::CurDir))
            })
            .ok_or_else(|| {
                format!(
                    "This bundle contains an unsafe path: {}",
                    entry.name().unwrap_or_default()
                )
            })?;
        let target = dest.join(relative);
        if entry.is_dir() {
            fs::create_dir_all(&target).map_err(|error| error.to_string())?;
            continue;
        }
        if let Some(parent) = target.parent() {
            fs::create_dir_all(parent).map_err(|error| error.to_string())?;
        }
        let mut out = File::create(&target).map_err(|error| error.to_string())?;
        let remaining = MAX_UNPACKED_BYTES - total;
        total += io::copy(&mut (&mut entry).take(remaining + 1), &mut out)
            .map_err(|error| error.to_string())?;
        if total > MAX_UNPACKED_BYTES {
            return Err("This bundle is too large.".into());
        }
        #[cfg(unix)]
        if let Some(mode) = entry.unix_mode() {
            use std::os::unix::fs::PermissionsExt;
            fs::set_permissions(&target, fs::Permissions::from_mode(0o644 | (mode & 0o111)))
                .map_err(|error| error.to_string())?;
        }
    }
    Ok(())
}

fn install<R: Runtime>(
    app: &AppHandle<R>,
    path: &str,
    manifest_hash: &str,
) -> Result<BundleInfo, String> {
    let mut archive = open_bundle(path)?;
    let info = bundle_info(app, &mut archive)?;
    if info.manifest_hash != manifest_hash {
        return Err(
            "The extension file changed after you opened it. Open it again to review the changes."
                .into(),
        );
    }
    let dir = PathBuf::from(&info.dir);
    let parent = dir
        .parent()
        .ok_or("The extension folder path isn't valid.")?;
    fs::create_dir_all(parent).map_err(|error| error.to_string())?;

    let staging = parent.join(format!(".staging-{}", uuid::Uuid::new_v4()));
    if let Err(error) = extract(&mut archive, &staging) {
        let _ = fs::remove_dir_all(&staging);
        return Err(error);
    }

    let old = parent.join(format!(".old-{}", uuid::Uuid::new_v4()));
    let replaced = dir.exists();
    if replaced && let Err(error) = fs::rename(&dir, &old) {
        let _ = fs::remove_dir_all(&staging);
        return Err(error.to_string());
    }
    if let Err(error) = fs::rename(&staging, &dir) {
        if replaced {
            let _ = fs::rename(&old, &dir);
        }
        let _ = fs::remove_dir_all(&staging);
        return Err(error.to_string());
    }
    if replaced {
        let _ = fs::remove_dir_all(&old);
    }
    Ok(info)
}

#[tauri::command]
pub async fn mcpb_read<R: Runtime>(app: AppHandle<R>, path: String) -> Result<BundleInfo, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let mut archive = open_bundle(&path)?;
        bundle_info(&app, &mut archive)
    })
    .await
    .map_err(|error| error.to_string())?
}

#[tauri::command]
pub async fn mcpb_install<R: Runtime>(
    app: AppHandle<R>,
    path: String,
    manifest_hash: String,
) -> Result<BundleInfo, String> {
    tauri::async_runtime::spawn_blocking(move || install(&app, &path, &manifest_hash))
        .await
        .map_err(|error| error.to_string())?
}

#[tauri::command]
pub async fn mcpb_remove<R: Runtime>(app: AppHandle<R>, id: String) -> Result<(), String> {
    let dir = bundle_dir(&app, &id)?;
    tauri::async_runtime::spawn_blocking(move || match fs::remove_dir_all(&dir) {
        Err(error) if error.kind() != io::ErrorKind::NotFound => Err(error.to_string()),
        _ => Ok(()),
    })
    .await
    .map_err(|error| error.to_string())?
}

#[tauri::command]
pub fn mcpb_take_opened(state: State<'_, OpenedBundles>) -> Vec<String> {
    state
        .0
        .lock()
        .map(|mut opened| std::mem::take(&mut *opened))
        .unwrap_or_default()
}
