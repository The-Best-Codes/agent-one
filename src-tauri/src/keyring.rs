use keyring::{Entry, Error as KeyringError};
use serde::{Deserialize, Serialize};
use tokio::task;

pub const SERVICE_NAME: &str = "com.agentone.app";

#[derive(Debug, Serialize, Deserialize)]
pub struct StorageResponse {
    pub value: Option<String>,
    pub error: Option<String>,
}

pub async fn get_password(key: &str) -> Result<Option<String>, String> {
    let key = key.to_string();
    task::spawn_blocking(move || {
        let entry =
            Entry::new(SERVICE_NAME, &key).map_err(|e| format!("Failed to create entry: {}", e))?;

        match entry.get_password() {
            Ok(value) => Ok(Some(value)),
            Err(KeyringError::NoEntry) => Ok(None),
            Err(e) => Err(format!("Failed to get password: {}", e)),
        }
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))?
}

pub async fn set_password(key: &str, value: &str) -> Result<(), String> {
    let key = key.to_string();
    let value = value.to_string();
    task::spawn_blocking(move || {
        let entry =
            Entry::new(SERVICE_NAME, &key).map_err(|e| format!("Failed to create entry: {}", e))?;

        entry
            .set_password(&value)
            .map_err(|e| format!("Failed to set password: {}", e))?;

        Ok(())
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))?
}

pub async fn delete_password(key: &str) -> Result<bool, String> {
    let key = key.to_string();
    task::spawn_blocking(move || {
        let entry =
            Entry::new(SERVICE_NAME, &key).map_err(|e| format!("Failed to create entry: {}", e))?;

        match entry.delete_credential() {
            Ok(_) => Ok(true),
            Err(KeyringError::NoEntry) => Ok(false),
            Err(e) => Err(format!("Failed to delete credential: {}", e)),
        }
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))?
}

#[tauri::command]
pub async fn storage_get_item(
    key: String,
    default_json: String,
) -> Result<StorageResponse, String> {
    match get_password(&key).await? {
        Some(value) => Ok(StorageResponse {
            value: Some(value),
            error: None,
        }),
        None => Ok(StorageResponse {
            value: Some(default_json),
            error: None,
        }),
    }
}

#[tauri::command]
pub async fn storage_set_item(key: String, value_json: String) -> Result<(), String> {
    set_password(&key, &value_json).await
}

#[tauri::command]
pub async fn storage_remove_item(key: String) -> Result<bool, String> {
    delete_password(&key).await
}

#[tauri::command]
pub async fn storage_has_item(key: String) -> Result<bool, String> {
    Ok(get_password(&key).await?.is_some())
}
