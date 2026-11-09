use serde::Serialize;

use super::NativeComputer;

pub const ACCESSIBILITY_MISSING: &str = "AgentOne does not have macOS Accessibility permission, so it can't use other apps yet. Tell the user to open AgentOne Settings → Tools → Computer Use, click Allow next to Accessibility, and turn AgentOne on in the System Settings window that opens.";
pub const SCREEN_RECORDING_MISSING: &str = "AgentOne does not have macOS Screen Recording permission, so it can't see other apps yet. Tell the user to open AgentOne Settings → Tools → Computer Use, click Allow next to Screen Recording, turn AgentOne on in the System Settings window that opens, then restart AgentOne if macOS asks.";

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PermissionStatus {
    pub accessibility: bool,
    pub screen_recording: bool,
}

pub fn status(computer: &NativeComputer) -> PermissionStatus {
    let permissions = computer.permissions();
    PermissionStatus {
        accessibility: permissions.accessibility,
        screen_recording: permissions.screen_recording,
    }
}

pub fn ensure_granted(computer: &NativeComputer) -> Result<(), String> {
    let permissions = computer.permissions();
    if !permissions.accessibility {
        return Err(ACCESSIBILITY_MISSING.to_string());
    }
    if !permissions.screen_recording {
        return Err(SCREEN_RECORDING_MISSING.to_string());
    }
    Ok(())
}

pub fn request(computer: &NativeComputer, permission: &str) -> Result<(), String> {
    let pane = match permission {
        "accessibility" => "Privacy_Accessibility",
        "screenRecording" => "Privacy_ScreenCapture",
        other => return Err(format!("Unknown permission: {other}")),
    };
    computer.request_permissions();
    if cfg!(target_os = "macos") {
        let url = format!("x-apple.systempreferences:com.apple.preference.security?{pane}");
        let _ = std::process::Command::new("open").arg(url).spawn();
    }
    Ok(())
}
