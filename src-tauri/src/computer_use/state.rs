use std::collections::HashMap;
use std::sync::{Mutex, MutexGuard, PoisonError};

use once_cell::sync::Lazy;
use xa11y::{anchor_point, Anchor, Element, Point, Screenshot};

use super::describe_error;

pub struct Snapshot {
    pub app_name: String,
    pub elements: Vec<Element>,
    pub window: Option<Element>,
    pub screenshot: Option<Screenshot>,
}

static SNAPSHOTS: Lazy<Mutex<HashMap<u32, Snapshot>>> = Lazy::new(|| Mutex::new(HashMap::new()));

pub fn snapshots() -> MutexGuard<'static, HashMap<u32, Snapshot>> {
    SNAPSHOTS.lock().unwrap_or_else(PoisonError::into_inner)
}

impl Snapshot {
    pub fn element(&self, index: usize) -> Result<&Element, String> {
        self.elements.get(index).ok_or_else(|| {
            format!(
                "Element [{index}] is not in the latest observation of \"{}\". Observe the app again.",
                self.app_name
            )
        })
    }

    pub fn label(&self, index: usize) -> String {
        match self.elements.get(index) {
            Some(e) => match e.name.as_deref().filter(|n| !n.is_empty()) {
                Some(name) => format!("[{index}] {} \"{name}\"", e.role),
                None => format!("[{index}] {}", e.role),
            },
            None => format!("[{index}]"),
        }
    }

    pub fn screenshot_point(&self, x: i32, y: i32) -> Result<Point, String> {
        let shot = self.screenshot.as_ref().ok_or_else(|| {
            "Coordinates need a screenshot. Observe the app with a screenshot first.".to_string()
        })?;
        shot.image_to_desktop(Point::new(x, y))
            .map_err(describe_error)
    }

    pub fn target_point(
        &self,
        element_index: Option<usize>,
        x: Option<i32>,
        y: Option<i32>,
    ) -> Result<Point, String> {
        match (element_index, x, y) {
            (Some(index), _, _) => element_center(self.element(index)?),
            (None, Some(x), Some(y)) => self.screenshot_point(x, y),
            _ => Err("Provide either elementIndex or both x and y.".to_string()),
        }
    }
}

pub fn element_center(element: &Element) -> Result<Point, String> {
    element
        .bounds
        .map(|rect| anchor_point(&rect, Anchor::Center))
        .ok_or_else(|| "The element has no on-screen position.".to_string())
}
