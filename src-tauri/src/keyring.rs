use keyring::{Entry, Error as KeyringError};
use serde::{Deserialize, Serialize};
use tokio::task;

const SERVICE_NAME: &str = "com.agentone.app";

#[derive(Debug, Serialize, Deserialize)]
pub struct StorageResponse {
    pub value: Option<String>,
    pub error: Option<String>,
}

#[tauri::command]
pub async fn storage_get_item(
    key: String,
    default_json: String,
) -> Result<StorageResponse, String> {
    task::spawn_blocking(move || {
        let entry =
            Entry::new(SERVICE_NAME, &key).map_err(|e| format!("Failed to create entry: {}", e))?;

        let password = entry.get_password();

        match password {
            Ok(stored_value) => Ok(StorageResponse {
                value: Some(stored_value),
                error: None,
            }),
            Err(KeyringError::NoEntry) => Ok(StorageResponse {
                value: Some(default_json),
                error: None,
            }),
            Err(e) => Err(format!("Failed to get password: {}", e)),
        }
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))?
}

#[tauri::command]
pub async fn storage_set_item(key: String, value_json: String) -> Result<(), String> {
    task::spawn_blocking(move || {
        let entry =
            Entry::new(SERVICE_NAME, &key).map_err(|e| format!("Failed to create entry: {}", e))?;

        entry
            .set_password(&value_json)
            .map_err(|e| format!("Failed to set password: {}", e))?;

        Ok(())
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))?
}

#[tauri::command]
pub async fn storage_remove_item(key: String) -> Result<bool, String> {
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
pub async fn storage_has_item(key: String) -> Result<bool, String> {
    task::spawn_blocking(move || {
        let entry =
            Entry::new(SERVICE_NAME, &key).map_err(|e| format!("Failed to create entry: {}", e))?;

        match entry.get_password() {
            Ok(_) => Ok(true),
            Err(KeyringError::NoEntry) => Ok(false),
            Err(e) => Err(format!("Failed to check credential: {}", e)),
        }
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))?
}
