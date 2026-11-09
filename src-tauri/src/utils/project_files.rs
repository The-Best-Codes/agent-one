use std::path::{Component, Path};

use ignore::WalkBuilder;
use serde::Serialize;

const MAX_ENTRIES: usize = 20_000;
const MAX_SCANNED_ENTRIES: usize = 200_000;
const MAX_DEPTH: usize = 8;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectEntry {
    path: String,
    name: String,
    is_directory: bool,
    depth: usize,
}

fn to_relative_path(root: &Path, path: &Path) -> Option<String> {
    let parts: Vec<String> = path
        .strip_prefix(root)
        .ok()?
        .components()
        .map(|component| match component {
            Component::Normal(part) => part.to_string_lossy().into_owned(),
            _ => String::new(),
        })
        .collect();
    Some(parts.join("/"))
}

fn walk_project(folder: &str) -> Result<Vec<ProjectEntry>, String> {
    let root = Path::new(folder);
    std::fs::read_dir(root).map_err(|error| format!("Can't read {folder}: {error}"))?;
    let walker = WalkBuilder::new(root)
        .hidden(false)
        .require_git(false)
        .max_depth(Some(MAX_DEPTH))
        .filter_entry(|entry| entry.file_name() != ".git")
        .build();
    let mut entries: Vec<ProjectEntry> = walker
        .filter_map(Result::ok)
        .filter(|entry| entry.depth() > 0)
        .filter_map(|entry| {
            let is_directory = entry.file_type()?.is_dir();
            let relative = to_relative_path(root, entry.path())?;
            Some(ProjectEntry {
                path: if is_directory {
                    format!("{relative}/")
                } else {
                    relative
                },
                name: entry.file_name().to_string_lossy().into_owned(),
                is_directory,
                depth: entry.depth(),
            })
        })
        .take(MAX_SCANNED_ENTRIES)
        .collect();
    entries.sort_by(|a, b| a.depth.cmp(&b.depth).then_with(|| a.path.cmp(&b.path)));
    entries.truncate(MAX_ENTRIES);
    Ok(entries)
}

#[tauri::command]
pub async fn list_project_files(folder: String) -> Result<Vec<ProjectEntry>, String> {
    tauri::async_runtime::spawn_blocking(move || walk_project(&folder))
        .await
        .map_err(|error| error.to_string())?
}
