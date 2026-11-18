use std::sync::Mutex;

use argon2::{Algorithm, Argon2, Params, Version};
use base64::Engine as _;
use base64::engine::general_purpose::{STANDARD, URL_SAFE_NO_PAD};
use chacha20poly1305::aead::{Aead, KeyInit, Payload};
use chacha20poly1305::{XChaCha20Poly1305, XNonce};
use hkdf::Hkdf;
use hmac::{Hmac, Mac};
use rand::Rng;
use serde::{Deserialize, Serialize};
use sha2::Sha256;
use tauri::State;

use crate::keyring::{delete_password, get_password, resolve_agent_db_path, set_password};

const VAULT_KEYRING_KEY: &str = "agent-one-encrypted-sync-vault";
const WRAP_AAD_PREFIX: &str = "agentone-vault-wrap-v1";
const ITEM_AAD_PREFIX: &str = "agentone-sync-item-v1";
const ENC_KEY_INFO: &[u8] = b"agentone-sync-enc-v1";
const ID_KEY_INFO: &[u8] = b"agentone-sync-id-v1";
const RECOVERY_KEY_INFO: &[u8] = b"agentone-vault-recovery-v1";

const KIND_PASSPHRASE: &str = "passphrase";
const KIND_RECOVERY: &str = "recovery";
const KDF_ARGON2ID: &str = "argon2id";
const KDF_HKDF_SHA256: &str = "hkdf-sha256";

const ARGON2_MEMORY_KIB: u32 = 64 * 1024;
const ARGON2_ITERATIONS: u32 = 3;
const ARGON2_PARALLELISM: u32 = 1;
const MAX_ARGON2_MEMORY_KIB: u32 = 1024 * 1024;
const MAX_ARGON2_ITERATIONS: u32 = 20;
const MAX_ARGON2_PARALLELISM: u32 = 8;

const MIN_PASSPHRASE_CHARS: usize = 8;
const RECOVERY_KEY_BYTES: usize = 16;

#[derive(Clone)]
struct UnlockedVault {
    vault_id: String,
    key: [u8; 32],
}

#[derive(Default)]
pub struct EncryptedSyncState(Mutex<Option<UnlockedVault>>);

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct WrappedKey {
    kind: String,
    kdf: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    memory_kib: Option<u32>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    iterations: Option<u32>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    parallelism: Option<u32>,
    salt: String,
    nonce: String,
    ciphertext: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreatedVault {
    vault_id: String,
    wrapped_keys: Vec<WrappedKey>,
    recovery_key: String,
}

#[derive(Serialize, Deserialize)]
pub struct SealedItem {
    id: String,
    nonce: String,
    ciphertext: String,
}

#[derive(Serialize)]
pub struct OpenedItem {
    id: String,
    name: String,
    value: serde_json::Value,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct StoredVault {
    vault_id: String,
    key: String,
}

#[derive(Serialize, Deserialize)]
pub struct ItemPayload {
    name: String,
    value: serde_json::Value,
}

fn random_bytes<const N: usize>() -> [u8; N] {
    let mut bytes = [0u8; N];
    rand::rng().fill_bytes(&mut bytes);
    bytes
}

fn decode_b64(value: &str, label: &str) -> Result<Vec<u8>, String> {
    STANDARD
        .decode(value)
        .map_err(|e| format!("Invalid {label}: {e}"))
}

fn hkdf_expand(ikm: &[u8], salt: Option<&[u8]>, info: &[u8]) -> Result<[u8; 32], String> {
    let mut out = [0u8; 32];
    Hkdf::<Sha256>::new(salt, ikm)
        .expand(info, &mut out)
        .map_err(|e| format!("Key derivation failed: {e}"))?;
    Ok(out)
}

fn argon2_key(
    passphrase: &str,
    salt: &[u8],
    memory_kib: u32,
    iterations: u32,
    parallelism: u32,
) -> Result<[u8; 32], String> {
    if memory_kib > MAX_ARGON2_MEMORY_KIB
        || iterations > MAX_ARGON2_ITERATIONS
        || parallelism > MAX_ARGON2_PARALLELISM
    {
        return Err("Vault uses unsupported key derivation settings".to_string());
    }
    let params = Params::new(memory_kib, iterations, parallelism, Some(32))
        .map_err(|e| format!("Invalid key derivation settings: {e}"))?;
    let mut out = [0u8; 32];
    Argon2::new(Algorithm::Argon2id, Version::V0x13, params)
        .hash_password_into(passphrase.as_bytes(), salt, &mut out)
        .map_err(|e| format!("Key derivation failed: {e}"))?;
    Ok(out)
}

fn cipher(key: &[u8; 32]) -> Result<XChaCha20Poly1305, String> {
    XChaCha20Poly1305::new_from_slice(key).map_err(|e| format!("Failed to initialize cipher: {e}"))
}

fn seal(key: &[u8; 32], plaintext: &[u8], aad: &[u8]) -> Result<(String, String), String> {
    let nonce = random_bytes::<24>();
    let ciphertext = cipher(key)?
        .encrypt(
            &XNonce::from(nonce),
            Payload {
                msg: plaintext,
                aad,
            },
        )
        .map_err(|e| format!("Encryption failed: {e}"))?;
    Ok((STANDARD.encode(nonce), STANDARD.encode(ciphertext)))
}

fn open(key: &[u8; 32], nonce_b64: &str, ciphertext_b64: &str, aad: &[u8]) -> Option<Vec<u8>> {
    let nonce: [u8; 24] = decode_b64(nonce_b64, "nonce").ok()?.try_into().ok()?;
    let ciphertext = decode_b64(ciphertext_b64, "ciphertext").ok()?;
    cipher(key)
        .ok()?
        .decrypt(
            &XNonce::from(nonce),
            Payload {
                msg: &ciphertext,
                aad,
            },
        )
        .ok()
}

fn wrap_aad(vault_id: &str, kind: &str) -> Vec<u8> {
    format!("{WRAP_AAD_PREFIX}|{vault_id}|{kind}").into_bytes()
}

fn item_aad(vault_id: &str, item_id: &str) -> Vec<u8> {
    format!("{ITEM_AAD_PREFIX}|{vault_id}|{item_id}").into_bytes()
}

fn format_recovery_key(bytes: &[u8]) -> String {
    let hex: String = bytes.iter().map(|b| format!("{b:02X}")).collect();
    hex.as_bytes()
        .chunks(4)
        .map(|chunk| String::from_utf8_lossy(chunk).into_owned())
        .collect::<Vec<_>>()
        .join("-")
}

fn parse_recovery_key(input: &str) -> Result<Vec<u8>, String> {
    let hex: String = input.chars().filter(|c| c.is_ascii_hexdigit()).collect();
    if hex.len() != RECOVERY_KEY_BYTES * 2 {
        return Err("That doesn't look like a recovery key".to_string());
    }
    (0..hex.len())
        .step_by(2)
        .map(|i| u8::from_str_radix(&hex[i..i + 2], 16))
        .collect::<Result<Vec<_>, _>>()
        .map_err(|_| "That doesn't look like a recovery key".to_string())
}

fn wrap_with_passphrase(
    vault_id: &str,
    vault_key: &[u8; 32],
    passphrase: &str,
) -> Result<WrappedKey, String> {
    let salt = random_bytes::<16>();
    let kek = argon2_key(
        passphrase,
        &salt,
        ARGON2_MEMORY_KIB,
        ARGON2_ITERATIONS,
        ARGON2_PARALLELISM,
    )?;
    let (nonce, ciphertext) = seal(&kek, vault_key, &wrap_aad(vault_id, KIND_PASSPHRASE))?;
    Ok(WrappedKey {
        kind: KIND_PASSPHRASE.to_string(),
        kdf: KDF_ARGON2ID.to_string(),
        memory_kib: Some(ARGON2_MEMORY_KIB),
        iterations: Some(ARGON2_ITERATIONS),
        parallelism: Some(ARGON2_PARALLELISM),
        salt: STANDARD.encode(salt),
        nonce,
        ciphertext,
    })
}

fn wrap_with_recovery_key(
    vault_id: &str,
    vault_key: &[u8; 32],
    recovery_key: &[u8],
) -> Result<WrappedKey, String> {
    let salt = random_bytes::<16>();
    let kek = hkdf_expand(recovery_key, Some(&salt), RECOVERY_KEY_INFO)?;
    let (nonce, ciphertext) = seal(&kek, vault_key, &wrap_aad(vault_id, KIND_RECOVERY))?;
    Ok(WrappedKey {
        kind: KIND_RECOVERY.to_string(),
        kdf: KDF_HKDF_SHA256.to_string(),
        memory_kib: None,
        iterations: None,
        parallelism: None,
        salt: STANDARD.encode(salt),
        nonce,
        ciphertext,
    })
}

fn unwrap_vault_key(
    vault_id: &str,
    wrapped_keys: &[WrappedKey],
    secret: &str,
    use_recovery_key: bool,
) -> Result<[u8; 32], String> {
    let kind = if use_recovery_key {
        KIND_RECOVERY
    } else {
        KIND_PASSPHRASE
    };
    let wrapped = wrapped_keys
        .iter()
        .find(|key| key.kind == kind)
        .ok_or_else(|| format!("This vault has no {kind} set up"))?;
    let salt = decode_b64(&wrapped.salt, "salt")?;

    let kek = match wrapped.kdf.as_str() {
        KDF_ARGON2ID => argon2_key(
            secret,
            &salt,
            wrapped.memory_kib.unwrap_or(ARGON2_MEMORY_KIB),
            wrapped.iterations.unwrap_or(ARGON2_ITERATIONS),
            wrapped.parallelism.unwrap_or(ARGON2_PARALLELISM),
        )?,
        KDF_HKDF_SHA256 => {
            hkdf_expand(&parse_recovery_key(secret)?, Some(&salt), RECOVERY_KEY_INFO)?
        }
        other => return Err(format!("Unsupported key derivation: {other}")),
    };

    let plaintext = open(
        &kek,
        &wrapped.nonce,
        &wrapped.ciphertext,
        &wrap_aad(vault_id, kind),
    )
    .ok_or_else(|| {
        if use_recovery_key {
            "Incorrect recovery key".to_string()
        } else {
            "Incorrect passphrase".to_string()
        }
    })?;

    plaintext
        .try_into()
        .map_err(|_| "Vault key has invalid length".to_string())
}

async fn store_unlocked(
    app: &tauri::AppHandle,
    state: &EncryptedSyncState,
    vault: UnlockedVault,
) -> Result<(), String> {
    let db_path = resolve_agent_db_path(app)?;
    let stored = serde_json::to_string(&StoredVault {
        vault_id: vault.vault_id.clone(),
        key: STANDARD.encode(vault.key),
    })
    .map_err(|e| e.to_string())?;
    set_password(VAULT_KEYRING_KEY, &stored, &db_path).await?;
    *state.0.lock().map_err(|e| e.to_string())? = Some(vault);
    Ok(())
}

async fn load_unlocked(
    app: &tauri::AppHandle,
    state: &EncryptedSyncState,
) -> Result<Option<UnlockedVault>, String> {
    if let Some(vault) = state.0.lock().map_err(|e| e.to_string())?.clone() {
        return Ok(Some(vault));
    }

    let db_path = resolve_agent_db_path(app)?;
    let Some(raw) = get_password(VAULT_KEYRING_KEY, &db_path).await? else {
        return Ok(None);
    };
    let Ok(stored) = serde_json::from_str::<StoredVault>(&raw) else {
        return Ok(None);
    };
    let Ok(key) = decode_b64(&stored.key, "vault key")?.try_into() else {
        return Ok(None);
    };

    let vault = UnlockedVault {
        vault_id: stored.vault_id,
        key,
    };
    *state.0.lock().map_err(|e| e.to_string())? = Some(vault.clone());
    Ok(Some(vault))
}

async fn require_unlocked(
    app: &tauri::AppHandle,
    state: &EncryptedSyncState,
) -> Result<UnlockedVault, String> {
    load_unlocked(app, state)
        .await?
        .ok_or_else(|| "Encrypted sync is locked".to_string())
}

#[tauri::command]
pub async fn encrypted_sync_create_vault(
    app: tauri::AppHandle,
    state: State<'_, EncryptedSyncState>,
    passphrase: String,
) -> Result<CreatedVault, String> {
    if passphrase.chars().count() < MIN_PASSPHRASE_CHARS {
        return Err(format!(
            "Passphrase must be at least {MIN_PASSPHRASE_CHARS} characters"
        ));
    }

    let vault_id = uuid::Uuid::new_v4().to_string();
    let vault_key = random_bytes::<32>();
    let recovery_key = random_bytes::<RECOVERY_KEY_BYTES>();

    let wrap_vault_id = vault_id.clone();
    let wrapped_keys = tokio::task::spawn_blocking(move || {
        Ok::<_, String>(vec![
            wrap_with_passphrase(&wrap_vault_id, &vault_key, &passphrase)?,
            wrap_with_recovery_key(&wrap_vault_id, &vault_key, &recovery_key)?,
        ])
    })
    .await
    .map_err(|e| e.to_string())??;

    store_unlocked(
        &app,
        &state,
        UnlockedVault {
            vault_id: vault_id.clone(),
            key: vault_key,
        },
    )
    .await?;

    Ok(CreatedVault {
        vault_id,
        wrapped_keys,
        recovery_key: format_recovery_key(&recovery_key),
    })
}

#[tauri::command]
pub async fn encrypted_sync_unlock(
    app: tauri::AppHandle,
    state: State<'_, EncryptedSyncState>,
    vault_id: String,
    wrapped_keys: Vec<WrappedKey>,
    secret: String,
    use_recovery_key: bool,
) -> Result<(), String> {
    let unwrap_vault_id = vault_id.clone();
    let key = tokio::task::spawn_blocking(move || {
        unwrap_vault_key(&unwrap_vault_id, &wrapped_keys, &secret, use_recovery_key)
    })
    .await
    .map_err(|e| e.to_string())??;

    store_unlocked(&app, &state, UnlockedVault { vault_id, key }).await
}

#[tauri::command]
pub async fn encrypted_sync_lock(
    app: tauri::AppHandle,
    state: State<'_, EncryptedSyncState>,
) -> Result<(), String> {
    *state.0.lock().map_err(|e| e.to_string())? = None;
    let db_path = resolve_agent_db_path(&app)?;
    delete_password(VAULT_KEYRING_KEY, &db_path).await?;
    Ok(())
}

#[tauri::command]
pub async fn encrypted_sync_vault_id(
    app: tauri::AppHandle,
    state: State<'_, EncryptedSyncState>,
) -> Result<Option<String>, String> {
    Ok(load_unlocked(&app, &state)
        .await?
        .map(|vault| vault.vault_id))
}

#[tauri::command]
pub async fn encrypted_sync_seal(
    app: tauri::AppHandle,
    state: State<'_, EncryptedSyncState>,
    items: Vec<ItemPayload>,
) -> Result<Vec<SealedItem>, String> {
    let vault = require_unlocked(&app, &state).await?;
    let enc_key = hkdf_expand(&vault.key, None, ENC_KEY_INFO)?;
    let id_key = hkdf_expand(&vault.key, None, ID_KEY_INFO)?;

    items
        .into_iter()
        .map(|item| {
            let mut mac = <Hmac<Sha256> as hmac::KeyInit>::new_from_slice(&id_key)
                .map_err(|e| e.to_string())?;
            mac.update(item.name.as_bytes());
            let id = URL_SAFE_NO_PAD.encode(mac.finalize().into_bytes());

            let plaintext = serde_json::to_vec(&item).map_err(|e| e.to_string())?;
            let (nonce, ciphertext) = seal(&enc_key, &plaintext, &item_aad(&vault.vault_id, &id))?;
            Ok(SealedItem {
                id,
                nonce,
                ciphertext,
            })
        })
        .collect()
}

#[tauri::command]
pub async fn encrypted_sync_open(
    app: tauri::AppHandle,
    state: State<'_, EncryptedSyncState>,
    items: Vec<SealedItem>,
) -> Result<Vec<OpenedItem>, String> {
    let vault = require_unlocked(&app, &state).await?;
    let enc_key = hkdf_expand(&vault.key, None, ENC_KEY_INFO)?;

    Ok(items
        .into_iter()
        .filter_map(|item| {
            let plaintext = open(
                &enc_key,
                &item.nonce,
                &item.ciphertext,
                &item_aad(&vault.vault_id, &item.id),
            )?;
            let payload = serde_json::from_slice::<ItemPayload>(&plaintext).ok()?;
            Some(OpenedItem {
                id: item.id,
                name: payload.name,
                value: payload.value,
            })
        })
        .collect())
}
