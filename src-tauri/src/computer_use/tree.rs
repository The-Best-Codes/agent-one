use std::fmt::Write as _;

use xa11y::{Element, Role, Toggled};

const MAX_DEPTH: usize = 64;
const MAX_TEXT_CHARS: usize = 300;
const NOISE_ACTIONS: &[&str] = &["scroll_to_visible", "scroll_into_view"];

pub struct TreeOutput {
    pub text: String,
    pub elements: Vec<Element>,
    pub window: Option<Element>,
    pub truncated: bool,
}

struct Walker {
    elements: Vec<Element>,
    out: String,
    max_elements: usize,
    truncated: bool,
}

pub fn is_window(element: &Element) -> bool {
    matches!(element.role, Role::Window)
        || (element.role == Role::Dialog
            && (element.states.minimized.is_some()
                || element.actions.iter().any(|a| a == "activate")))
}

fn truncate(text: &str) -> String {
    let clean = text.replace('\n', "\\n");
    if clean.chars().count() <= MAX_TEXT_CHARS {
        return clean;
    }
    let mut short: String = clean.chars().take(MAX_TEXT_CHARS).collect();
    short.push('…');
    short
}

fn useful_actions(element: &Element) -> Vec<&str> {
    element
        .actions
        .iter()
        .map(String::as_str)
        .filter(|a| !NOISE_ACTIONS.contains(a))
        .collect()
}

fn non_empty(text: &Option<String>) -> Option<&str> {
    text.as_deref().map(str::trim).filter(|t| !t.is_empty())
}

fn is_transparent(element: &Element) -> bool {
    matches!(element.role, Role::Group | Role::Unknown)
        && non_empty(&element.name).is_none()
        && non_empty(&element.value).is_none()
        && non_empty(&element.description).is_none()
        && useful_actions(element).is_empty()
        && !element.states.focused
}

impl Walker {
    fn line(&mut self, element: &Element, depth: usize, suffix: &str) {
        let index = self.elements.len();
        self.elements.push(element.clone());

        let _ = write!(
            self.out,
            "{}[{}] {}",
            "  ".repeat(depth),
            index,
            element.role
        );
        if let Some(name) = non_empty(&element.name) {
            let _ = write!(self.out, " \"{}\"", truncate(name));
        }
        if let Some(value) = non_empty(&element.value) {
            let _ = write!(self.out, " value=\"{}\"", truncate(value));
        }
        if let Some(description) = non_empty(&element.description) {
            if Some(description) != non_empty(&element.name) {
                let _ = write!(self.out, " description=\"{}\"", truncate(description));
            }
        }

        let states = &element.states;
        let mut flags: Vec<&str> = Vec::new();
        if states.focused {
            flags.push("focused");
        }
        if states.selected {
            flags.push("selected");
        }
        if !states.enabled {
            flags.push("disabled");
        }
        match states.checked {
            Some(Toggled::On) => flags.push("checked"),
            Some(Toggled::Off) => flags.push("unchecked"),
            Some(Toggled::Mixed) => flags.push("mixed"),
            None => {}
        }
        match states.expanded {
            Some(true) => flags.push("expanded"),
            Some(false) => flags.push("collapsed"),
            None => {}
        }
        if states.editable && !matches!(element.role, Role::TextField | Role::TextArea) {
            flags.push("editable");
        }
        if !flags.is_empty() {
            let _ = write!(self.out, " ({})", flags.join(", "));
        }

        let actions = useful_actions(element);
        if !actions.is_empty() {
            let _ = write!(self.out, " actions=[{}]", actions.join(", "));
        }
        self.out.push_str(suffix);
        self.out.push('\n');
    }

    fn walk(&mut self, element: &Element, depth: usize) {
        if self.elements.len() >= self.max_elements {
            self.truncated = true;
            return;
        }
        if !element.states.visible {
            return;
        }

        let child_depth = if is_transparent(element) {
            depth
        } else {
            self.line(element, depth, "");
            depth + 1
        };

        self.walk_children(element, child_depth);
    }

    fn walk_children(&mut self, element: &Element, depth: usize) {
        if depth >= MAX_DEPTH {
            return;
        }
        let Ok(children) = element.children() else {
            return;
        };
        for child in &children {
            self.walk(child, depth);
        }
    }
}

pub fn pick_window<'a>(windows: &'a [Element], query: Option<&str>) -> Option<&'a Element> {
    if let Some(query) = query.map(str::trim).filter(|q| !q.is_empty()) {
        if let Ok(index) = query.parse::<usize>() {
            return windows.get(index);
        }
        let query = query.to_lowercase();
        return windows.iter().find(|w| {
            w.name
                .as_deref()
                .is_some_and(|n| n.to_lowercase().contains(&query))
        });
    }
    windows
        .iter()
        .find(|w| w.states.active || w.states.focused)
        .or_else(|| windows.iter().find(|w| w.states.minimized != Some(true)))
        .or_else(|| windows.first())
}

pub fn build_tree(
    roots: &[Element],
    window_query: Option<&str>,
    include_menu_bar: bool,
    max_elements: usize,
) -> TreeOutput {
    let windows: Vec<Element> = roots.iter().filter(|e| is_window(e)).cloned().collect();
    let target = pick_window(&windows, window_query).cloned();
    let target_handle = target.as_ref().map(|t| t.data().handle);

    let mut walker = Walker {
        elements: Vec::new(),
        out: String::new(),
        max_elements,
        truncated: false,
    };

    if let Some(query) = window_query.filter(|q| !q.trim().is_empty()) {
        if target.is_none() {
            let _ = writeln!(walker.out, "No window matched \"{query}\".");
        }
    }

    let mut window_number = 0;
    for root in roots {
        if walker.elements.len() >= walker.max_elements {
            walker.truncated = true;
            break;
        }
        if is_window(root) {
            let label = format!(" window={window_number}");
            window_number += 1;
            if Some(root.data().handle) == target_handle {
                walker.line(root, 0, &label);
                walker.walk_children(root, 1);
            } else {
                walker.line(root, 0, &format!("{label} (not expanded)"));
            }
        } else if root.role == Role::MenuBar && !include_menu_bar {
            walker.line(root, 0, " (not expanded)");
        } else {
            walker.walk(root, 0);
        }
    }

    if walker.truncated {
        let _ = writeln!(
            walker.out,
            "… output truncated after {} elements. Ask for a larger maxElements or use a screenshot.",
            walker.max_elements
        );
    }

    TreeOutput {
        text: walker.out,
        elements: walker.elements,
        window: target,
        truncated: walker.truncated,
    }
}
