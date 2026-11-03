use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PermissionStatus {
    pub accessibility: bool,
    pub screen_recording: bool,
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

pub fn status() -> PermissionStatus {
    #[cfg(target_os = "macos")]
    {
        PermissionStatus {
            accessibility: macos::accessibility(),
            screen_recording: macos::screen_recording(),
        }
    }
    #[cfg(target_os = "windows")]
    {
        PermissionStatus {
            accessibility: true,
            screen_recording: true,
        }
    }
}

// xa11y caches permission errors until restart, so check before calling it.
pub fn ensure_granted() -> Result<(), String> {
    let status = status();
    if !status.accessibility {
        return Err("AgentOne does not have Accessibility permission. Ask the user to grant it in AgentOne Settings → Tools → Computer Use.".to_string());
    }
    if !status.screen_recording {
        return Err("AgentOne does not have Screen Recording permission. Ask the user to grant it in AgentOne Settings → Tools → Computer Use.".to_string());
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
    #[cfg(not(target_os = "macos"))]
    {
        let _ = permission;
        Ok(())
    }
}
