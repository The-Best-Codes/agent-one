use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PermissionStatus {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub accessibility: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub screen_recording: Option<bool>,
    pub supported: bool,
}

#[cfg(target_os = "macos")]
mod macos {
    use std::ffi::c_void;

    #[link(name = "ApplicationServices", kind = "framework")]
    extern "C" {
        fn AXIsProcessTrusted() -> bool;
        fn AXIsProcessTrustedWithOptions(options: *const c_void) -> bool;
        static kAXTrustedCheckOptionPrompt: *const c_void;
    }

    #[link(name = "CoreGraphics", kind = "framework")]
    extern "C" {
        fn CGPreflightScreenCaptureAccess() -> bool;
        fn CGRequestScreenCaptureAccess() -> bool;
    }

    #[link(name = "CoreFoundation", kind = "framework")]
    extern "C" {
        static kCFBooleanTrue: *const c_void;
        static kCFTypeDictionaryKeyCallBacks: c_void;
        static kCFTypeDictionaryValueCallBacks: c_void;
        fn CFDictionaryCreate(
            allocator: *const c_void,
            keys: *const *const c_void,
            values: *const *const c_void,
            num_values: isize,
            key_callbacks: *const c_void,
            value_callbacks: *const c_void,
        ) -> *const c_void;
        fn CFRelease(cf: *const c_void);
    }

    pub fn accessibility() -> bool {
        unsafe { AXIsProcessTrusted() }
    }

    pub fn screen_recording() -> bool {
        unsafe { CGPreflightScreenCaptureAccess() }
    }

    pub fn request_accessibility() {
        unsafe {
            let keys = [kAXTrustedCheckOptionPrompt];
            let values = [kCFBooleanTrue];
            let options = CFDictionaryCreate(
                std::ptr::null(),
                keys.as_ptr(),
                values.as_ptr(),
                1,
                &kCFTypeDictionaryKeyCallBacks as *const c_void,
                &kCFTypeDictionaryValueCallBacks as *const c_void,
            );
            AXIsProcessTrustedWithOptions(options);
            if !options.is_null() {
                CFRelease(options);
            }
        }
    }

    pub fn request_screen_recording() {
        unsafe {
            CGRequestScreenCaptureAccess();
        }
    }

    pub fn open_settings_pane(pane: &str) {
        let url = format!("x-apple.systempreferences:com.apple.preference.security?{pane}");
        let _ = std::process::Command::new("open").arg(url).spawn();
    }
}

#[cfg(target_os = "linux")]
mod linux {
    use zbus::blocking::{Connection, Proxy};

    fn status_proxy(connection: &Connection) -> zbus::Result<Proxy<'_>> {
        Proxy::new(
            connection,
            "org.a11y.Bus",
            "/org/a11y/bus",
            "org.a11y.Status",
        )
    }

    pub fn accessibility() -> bool {
        let Ok(connection) = Connection::session() else {
            return false;
        };
        let Ok(proxy) = status_proxy(&connection) else {
            return false;
        };
        proxy.get_property::<bool>("IsEnabled").unwrap_or(false)
    }

    pub fn request_accessibility() -> Result<(), String> {
        let connection = Connection::session().map_err(|e| e.to_string())?;
        let proxy = status_proxy(&connection).map_err(|e| e.to_string())?;
        proxy
            .set_property("IsEnabled", true)
            .map_err(|e| format!("Could not turn on accessibility support: {e}"))
    }
}

pub fn status() -> PermissionStatus {
    #[cfg(target_os = "macos")]
    {
        PermissionStatus {
            accessibility: Some(macos::accessibility()),
            screen_recording: Some(macos::screen_recording()),
            supported: true,
        }
    }
    #[cfg(target_os = "linux")]
    {
        PermissionStatus {
            accessibility: Some(linux::accessibility()),
            screen_recording: None,
            supported: true,
        }
    }
    #[cfg(target_os = "windows")]
    {
        PermissionStatus {
            accessibility: None,
            screen_recording: None,
            supported: true,
        }
    }
    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    {
        PermissionStatus {
            accessibility: None,
            screen_recording: None,
            supported: false,
        }
    }
}

pub fn linux_accessibility_hint() -> Option<String> {
    #[cfg(target_os = "linux")]
    if !linux::accessibility() {
        return Some("Accessibility support is off on this computer, so some apps are hidden. Ask the user to allow it in AgentOne Settings → Tools → Computer Use, then reopen the apps they want to use.".to_string());
    }
    None
}

// xa11y caches permission errors until restart, so check before calling it.
pub fn ensure_granted() -> Result<(), String> {
    let status = status();
    if !status.supported {
        return Err("Computer use is not supported on this platform.".to_string());
    }
    #[cfg(target_os = "macos")]
    {
        if status.accessibility == Some(false) {
            return Err("AgentOne does not have Accessibility permission. Ask the user to grant it in AgentOne Settings → Tools → Computer Use.".to_string());
        }
        if status.screen_recording == Some(false) {
            return Err("AgentOne does not have Screen Recording permission. Ask the user to grant it in AgentOne Settings → Tools → Computer Use.".to_string());
        }
    }
    Ok(())
}

pub fn request(permission: &str) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        match permission {
            "accessibility" => {
                macos::request_accessibility();
                macos::open_settings_pane("Privacy_Accessibility");
            }
            "screenRecording" => {
                macos::request_screen_recording();
                macos::open_settings_pane("Privacy_ScreenCapture");
            }
            other => return Err(format!("Unknown permission: {other}")),
        }
        Ok(())
    }
    #[cfg(target_os = "linux")]
    {
        match permission {
            "accessibility" => linux::request_accessibility(),
            other => Err(format!("Unknown permission: {other}")),
        }
    }
    #[cfg(not(any(target_os = "macos", target_os = "linux")))]
    {
        let _ = permission;
        Ok(())
    }
}
