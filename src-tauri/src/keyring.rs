use std::path::{Path, PathBuf};
use std::sync::Arc;

use base64::engine::general_purpose::{STANDARD, URL_SAFE_NO_PAD};
use base64::Engine as _;
use chacha20poly1305::aead::{Aead, KeyInit};
use chacha20poly1305::{XChaCha20Poly1305, XNonce};
use keyring_core::{CredentialStore, Entry, Error as KeyringError};
use rand::Rng;
use serde::{Deserialize, Serialize};
use sqlx::sqlite::{SqliteConnectOptions, SqlitePoolOptions};
use sqlx::Row;
use sqlx::SqlitePool;
use tauri::Manager;
use tokio::task;

pub const SERVICE_NAME: &str = "com.agentone.app";
const FALLBACK_MARKER_PREFIX: &str = "__agentone_secret_fallback_v1__:";

pub fn initialize_keyring_store() -> Result<(), String> {
    let store: Arc<CredentialStore> = {
        #[cfg(target_os = "macos")]
        {
            apple_native_keyring_store::keychain::Store::new()
                .map_err(|e| format!("Failed to initialize macOS keychain store: {}", e))?
        }

        #[cfg(target_os = "ios")]
        {
            apple_native_keyring_store::protected::Store::new()
                .map_err(|e| format!("Failed to initialize iOS protected store: {}", e))?
        }

        #[cfg(target_os = "windows")]
        {
            windows_native_keyring_store::Store::new()
                .map_err(|e| format!("Failed to initialize Windows credential store: {}", e))?
        }

        #[cfg(all(
            target_os = "linux",
            not(any(
                target_os = "android",
                target_os = "ios",
                target_os = "macos",
                target_os = "windows"
            ))
        ))]
        {
            zbus_secret_service_keyring_store::Store::new()
                .map_err(|e| format!("Failed to initialize Secret Service store: {}", e))?
        }

        #[cfg(not(any(
            target_os = "macos",
            target_os = "ios",
            target_os = "windows",
            target_os = "linux"
        )))]
        {
            keyring_core::mock::Store::new()
                .map_err(|e| format!("Failed to initialize fallback keyring store: {}", e))?
        }
    };

    keyring_core::set_default_store(store);
    Ok(())
}

struct EncryptedFallbackRecord {
    keyring_ref: String,
    nonce_b64: String,
    ciphertext_b64: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct StorageResponse {
    pub value: Option<String>,
    pub error: Option<String>,
}

pub fn resolve_agent_db_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let app_config_dir = app
        .path()
        .app_config_dir()
        .map_err(|e| format!("Failed to resolve app config directory: {}", e))?;

    std::fs::create_dir_all(&app_config_dir)
        .map_err(|e| format!("Failed to create app config directory: {}", e))?;

    Ok(app_config_dir.join("agent-one.db"))
}

async fn open_db_pool(db_path: &Path) -> Result<SqlitePool, String> {
    let options = SqliteConnectOptions::new()
        .filename(db_path)
        .create_if_missing(true);

    SqlitePoolOptions::new()
        .max_connections(1)
        .connect_with(options)
        .await
        .map_err(|e| format!("Failed to open SQLite database: {}", e))
}

async fn get_fallback_record(
    db_path: &Path,
    logical_key: &str,
) -> Result<Option<EncryptedFallbackRecord>, String> {
    let pool = open_db_pool(db_path).await?;

    let row = sqlx::query(
        "SELECT keyring_ref, nonce, ciphertext FROM secure_secret_fallback WHERE logical_key = ?",
    )
    .bind(logical_key)
    .fetch_optional(&pool)
    .await
    .map_err(|e| format!("Failed to read fallback secret: {}", e))?;

    row.map(|r| {
        Ok(EncryptedFallbackRecord {
            keyring_ref: r
                .try_get("keyring_ref")
                .map_err(|e| format!("Failed to decode keyring_ref column: {}", e))?,
            nonce_b64: r
                .try_get("nonce")
                .map_err(|e| format!("Failed to decode nonce column: {}", e))?,
            ciphertext_b64: r
                .try_get("ciphertext")
                .map_err(|e| format!("Failed to decode ciphertext column: {}", e))?,
        })
    })
    .transpose()
}

async fn upsert_fallback_record(
    db_path: &Path,
    logical_key: &str,
    keyring_ref: &str,
    nonce_b64: &str,
    ciphertext_b64: &str,
) -> Result<(), String> {
    let pool = open_db_pool(db_path).await?;

    sqlx::query(
        "INSERT INTO secure_secret_fallback (logical_key, keyring_ref, nonce, ciphertext, updated_at)
         VALUES (?, ?, ?, ?, CAST(strftime('%s', 'now') AS INTEGER))
         ON CONFLICT(logical_key) DO UPDATE SET
           keyring_ref = excluded.keyring_ref,
           nonce = excluded.nonce,
           ciphertext = excluded.ciphertext,
           updated_at = excluded.updated_at",
    )
    .bind(logical_key)
    .bind(keyring_ref)
    .bind(nonce_b64)
    .bind(ciphertext_b64)
    .execute(&pool)
    .await
    .map_err(|e| format!("Failed to write fallback secret: {}", e))?;

    Ok(())
}

async fn delete_fallback_record(
    db_path: &Path,
    logical_key: &str,
) -> Result<Option<String>, String> {
    let pool = open_db_pool(db_path).await?;

    let row = sqlx::query("SELECT keyring_ref FROM secure_secret_fallback WHERE logical_key = ?")
        .bind(logical_key)
        .fetch_optional(&pool)
        .await
        .map_err(|e| format!("Failed to query fallback secret before delete: {}", e))?;

    sqlx::query("DELETE FROM secure_secret_fallback WHERE logical_key = ?")
        .bind(logical_key)
        .execute(&pool)
        .await
        .map_err(|e| format!("Failed to delete fallback secret: {}", e))?;

    row.map(|r| {
        r.try_get("keyring_ref")
            .map_err(|e| format!("Failed to decode keyring_ref column: {}", e))
    })
    .transpose()
}

fn fallback_key_ref(logical_key: &str) -> String {
    format!(
        "agentone-secret-key-v1-{}",
        URL_SAFE_NO_PAD.encode(logical_key)
    )
}

fn encrypt_value(plaintext: &str) -> Result<(String, String, String), String> {
    let mut key_bytes = [0u8; 32];
    rand::rng().fill_bytes(&mut key_bytes);

    let mut nonce_bytes = [0u8; 24];
    rand::rng().fill_bytes(&mut nonce_bytes);

    let cipher = XChaCha20Poly1305::new_from_slice(&key_bytes)
        .map_err(|e| format!("Failed to initialize cipher: {}", e))?;
    let ciphertext = cipher
        .encrypt(&XNonce::from(nonce_bytes), plaintext.as_bytes())
        .map_err(|e| format!("Failed to encrypt fallback secret: {}", e))?;

    Ok((
        STANDARD.encode(key_bytes),
        STANDARD.encode(nonce_bytes),
        STANDARD.encode(ciphertext),
    ))
}

fn decrypt_value(key_b64: &str, nonce_b64: &str, ciphertext_b64: &str) -> Result<String, String> {
    let key_bytes = STANDARD
        .decode(key_b64)
        .map_err(|e| format!("Failed to decode fallback key: {}", e))?;
    let nonce_bytes = STANDARD
        .decode(nonce_b64)
        .map_err(|e| format!("Failed to decode fallback nonce: {}", e))?;
    let ciphertext = STANDARD
        .decode(ciphertext_b64)
        .map_err(|e| format!("Failed to decode fallback ciphertext: {}", e))?;

    if key_bytes.len() != 32 {
        return Err("Fallback key has invalid length".to_string());
    }
    if nonce_bytes.len() != 24 {
        return Err("Fallback nonce has invalid length".to_string());
    }

    let cipher = XChaCha20Poly1305::new_from_slice(&key_bytes)
        .map_err(|e| format!("Failed to initialize fallback cipher: {}", e))?;

    let nonce_arr: [u8; 24] = nonce_bytes
        .try_into()
        .map_err(|_| "Invalid nonce length".to_string())?;
    let plaintext = cipher
        .decrypt(&XNonce::from(nonce_arr), ciphertext.as_ref())
        .map_err(|e| format!("Failed to decrypt fallback secret: {}", e))?;

    String::from_utf8(plaintext).map_err(|e| format!("Fallback plaintext is not UTF-8: {}", e))
}

fn is_length_limit_error(message: &str) -> bool {
    let lower = message.to_lowercase();
    lower.contains("platform limit")
        || (lower.contains("longer") && lower.contains("utf-16"))
        || lower.contains("attribute \"password encoded as utf-16\" is longer")
}

async fn get_keyring_password_only(key: &str) -> Result<Option<String>, String> {
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

async fn set_keyring_password_only(key: &str, value: &str) -> Result<(), String> {
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

async fn delete_keyring_password_only(key: &str) -> Result<bool, String> {
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

async fn load_fallback_value(
    db_path: &Path,
    logical_key: &str,
    keyring_ref: &str,
) -> Result<String, String> {
    let record = get_fallback_record(db_path, logical_key)
        .await?
        .ok_or_else(|| "Fallback secret metadata not found in database".to_string())?;

    if record.keyring_ref != keyring_ref {
        return Err("Fallback key reference mismatch".to_string());
    }

    let encryption_key = get_keyring_password_only(keyring_ref)
        .await?
        .ok_or_else(|| "Fallback decryption key not found in keyring".to_string())?;

    decrypt_value(&encryption_key, &record.nonce_b64, &record.ciphertext_b64)
}

pub async fn get_password(key: &str, db_path: &Path) -> Result<Option<String>, String> {
    let keyring_value = get_keyring_password_only(key).await?;

    let Some(value) = keyring_value else {
        if let Some(record) = get_fallback_record(db_path, key).await? {
            let decrypted = load_fallback_value(db_path, key, &record.keyring_ref).await?;
            return Ok(Some(decrypted));
        }
        return Ok(None);
    };

    if let Some(keyring_ref) = value.strip_prefix(FALLBACK_MARKER_PREFIX) {
        let decrypted = load_fallback_value(db_path, key, keyring_ref).await?;
        return Ok(Some(decrypted));
    }

    Ok(Some(value))
}

pub async fn set_password(key: &str, value: &str, db_path: &Path) -> Result<(), String> {
    match set_keyring_password_only(key, value).await {
        Ok(()) => {
            if let Some(keyring_ref) = delete_fallback_record(db_path, key).await? {
                let _ = delete_keyring_password_only(&keyring_ref).await;
            }
            Ok(())
        }
        Err(primary_error) => {
            if !is_length_limit_error(&primary_error) {
                return Err(primary_error);
            }

            let keyring_ref = fallback_key_ref(key);
            let marker = format!("{}{}", FALLBACK_MARKER_PREFIX, keyring_ref);

            let (encryption_key, nonce_b64, ciphertext_b64) = encrypt_value(value)?;

            set_keyring_password_only(&keyring_ref, &encryption_key).await?;
            upsert_fallback_record(db_path, key, &keyring_ref, &nonce_b64, &ciphertext_b64).await?;
            set_keyring_password_only(key, &marker).await?;

            Ok(())
        }
    }
}

pub async fn delete_password(key: &str, db_path: &Path) -> Result<bool, String> {
    let deleted_primary = delete_keyring_password_only(key).await?;

    let mut deleted_fallback_data = false;
    if let Some(keyring_ref) = delete_fallback_record(db_path, key).await? {
        let _ = delete_keyring_password_only(&keyring_ref).await?;
        deleted_fallback_data = true;
    }

    Ok(deleted_primary || deleted_fallback_data)
}

async fn has_password(key: &str, db_path: &Path) -> Result<bool, String> {
    if get_keyring_password_only(key).await?.is_some() {
        return Ok(true);
    }

    Ok(get_fallback_record(db_path, key).await?.is_some())
}

#[tauri::command]
pub async fn storage_get_item(
    app: tauri::AppHandle,
    key: String,
    default_json: String,
) -> Result<StorageResponse, String> {
    let db_path = resolve_agent_db_path(&app)?;

    match get_password(&key, &db_path).await? {
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
pub async fn storage_set_item(
    app: tauri::AppHandle,
    key: String,
    value_json: String,
) -> Result<(), String> {
    let db_path = resolve_agent_db_path(&app)?;
    set_password(&key, &value_json, &db_path).await
}

#[tauri::command]
pub async fn storage_remove_item(app: tauri::AppHandle, key: String) -> Result<bool, String> {
    let db_path = resolve_agent_db_path(&app)?;
    delete_password(&key, &db_path).await
}

#[tauri::command]
pub async fn storage_has_item(app: tauri::AppHandle, key: String) -> Result<bool, String> {
    let db_path = resolve_agent_db_path(&app)?;
    has_password(&key, &db_path).await
}
