use std::collections::HashMap;
use std::sync::Arc;

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::process::{Child, Command};
use tokio::sync::Mutex;

struct ManagedProcess {
    stdin: tokio::process::ChildStdin,
    /// Raw OS PID, used for kill on platforms where we need it
    _pid: u32,
}

type ProcessMap = Arc<Mutex<HashMap<u32, ManagedProcess>>>;

fn get_process_map() -> ProcessMap {
    use once_cell::sync::Lazy;
    static MAP: Lazy<ProcessMap> = Lazy::new(|| Arc::new(Mutex::new(HashMap::new())));
    MAP.clone()
}

#[derive(Clone, Serialize)]
pub struct ShellStdoutEvent {
    pub pid: u32,
    pub data: String,
}

#[derive(Clone, Serialize)]
pub struct ShellStderrEvent {
    pub pid: u32,
    pub data: String,
}

#[derive(Clone, Serialize)]
pub struct ShellCloseEvent {
    pub pid: u32,
    pub code: Option<i32>,
}

#[derive(Clone, Serialize)]
pub struct ShellErrorEvent {
    pub pid: u32,
    pub message: String,
}

#[derive(Deserialize)]
pub struct SpawnOptions {
    pub command: String,
    pub env: Option<HashMap<String, String>>,
    pub cwd: Option<String>,
}

/// Spawn a process. Returns its PID.
///
/// Stdout/stderr are streamed as global Tauri events:
/// `shell:stdout`: `{ pid, data }`
/// `shell:stderr`: `{ pid, data }`
/// `shell:close`: `{ pid, code }`
/// `shell:error`: `{ pid, message }`
#[tauri::command]
pub async fn shell_spawn(app: AppHandle, options: SpawnOptions) -> Result<u32, String> {
    let mut cmd: Command;

    #[cfg(target_os = "windows")]
    {
        // On Windows run through cmd /C, which hopefully should handle built-ins, PATH, .cmd/.bat extensions
        cmd = Command::new("cmd");
        cmd.args(["/C", &options.command]);
        // Don't show a console window for the child (untested)
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x08000000);
    }
    #[cfg(not(target_os = "windows"))]
    {
        // On Unix, let the shell handle the command string (quoting, pipes, etc.)
        cmd = Command::new("sh");
        cmd.args(["-c", &options.command]);
    }

    if let Some(env_map) = &options.env {
        for (k, v) in env_map {
            cmd.env(k, v);
        }
    }
    if let Some(cwd) = &options.cwd {
        cmd.current_dir(cwd);
    }

    cmd.stdin(std::process::Stdio::piped())
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped());

    let mut child: Child = cmd.spawn().map_err(|e| e.to_string())?;
    let pid = child.id().ok_or("Could not get process PID")?;

    let stdin = child.stdin.take().ok_or("Could not get stdin")?;
    let stdout = child.stdout.take().ok_or("Could not get stdout")?;
    let stderr = child.stderr.take().ok_or("Could not get stderr")?;

    // Register the process so we can write to its stdin
    {
        let map = get_process_map();
        let mut lock = map.lock().await;
        lock.insert(pid, ManagedProcess { stdin, _pid: pid });
    }

    // Stream stdout lines as events
    {
        let app_clone = app.clone();
        tokio::spawn(async move {
            let mut reader = BufReader::new(stdout).lines();
            while let Ok(Some(line)) = reader.next_line().await {
                let _ = app_clone.emit(
                    "shell:stdout",
                    ShellStdoutEvent {
                        pid,
                        data: line + "\n",
                    },
                );
            }
        });
    }

    // Stream stderr lines as events
    {
        let app_clone = app.clone();
        tokio::spawn(async move {
            let mut reader = BufReader::new(stderr).lines();
            while let Ok(Some(line)) = reader.next_line().await {
                let _ = app_clone.emit(
                    "shell:stderr",
                    ShellStderrEvent {
                        pid,
                        data: line + "\n",
                    },
                );
            }
        });
    }

    // Wait for the process to exit and emit close/error event
    {
        let map = get_process_map();
        tokio::spawn(async move {
            let exit = child.wait().await;
            // Drop stdin by removing from registry
            let mut lock = map.lock().await;
            lock.remove(&pid);
            drop(lock);

            let code = match exit {
                Ok(status) => status.code(),
                Err(e) => {
                    let _ = app.emit(
                        "shell:error",
                        ShellErrorEvent {
                            pid,
                            message: e.to_string(),
                        },
                    );
                    None
                }
            };
            let _ = app.emit("shell:close", ShellCloseEvent { pid, code });
        });
    }

    Ok(pid)
}

/// Write a string to the stdin of a running process.
#[tauri::command]
pub async fn shell_write_stdin(pid: u32, data: String) -> Result<(), String> {
    let map = get_process_map();
    let mut lock = map.lock().await;
    let proc = lock
        .get_mut(&pid)
        .ok_or_else(|| format!("No process with PID {pid}"))?;
    proc.stdin
        .write_all(data.as_bytes())
        .await
        .map_err(|e| e.to_string())?;
    proc.stdin.flush().await.map_err(|e| e.to_string())
}

/// Kill a running process by PID.
#[tauri::command]
pub async fn shell_kill(pid: u32) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        Command::new("taskkill")
            .args(["/F", "/PID", &pid.to_string()])
            .spawn()
            .map_err(|e| e.to_string())?
            .wait()
            .await
            .map_err(|e| e.to_string())?;
    }
    #[cfg(not(target_os = "windows"))]
    {
        Command::new("kill")
            .args(["-9", &pid.to_string()])
            .spawn()
            .map_err(|e| e.to_string())?
            .wait()
            .await
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}
