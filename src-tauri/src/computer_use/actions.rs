use computer_use::{
    ClickOptions, ClickOutcome, ClickTarget, MouseButton, ScrollDirection, SelectionMode,
    TextSelection,
};
use serde::Deserialize;

use super::{apps, describe_error, NativeComputer};

const DEFAULT_SCROLL_PAGES: f64 = 1.0;

#[derive(Debug, Deserialize)]
#[serde(
    tag = "type",
    rename_all = "camelCase",
    rename_all_fields = "camelCase"
)]
pub enum ComputerAction {
    OpenApp,
    Click {
        element_index: Option<usize>,
        x: Option<f64>,
        y: Option<f64>,
        button: Option<String>,
        click_count: Option<u32>,
    },
    TypeText {
        text: String,
        element_index: Option<usize>,
    },
    PressKey {
        key: String,
    },
    Scroll {
        direction: String,
        pages: Option<f64>,
        element_index: Option<usize>,
        x: Option<f64>,
        y: Option<f64>,
    },
    Drag {
        from_x: f64,
        from_y: f64,
        to_x: f64,
        to_y: f64,
    },
    SetValue {
        element_index: usize,
        value: String,
    },
    SelectText {
        element_index: usize,
        text: String,
        prefix: Option<String>,
        suffix: Option<String>,
        mode: Option<String>,
    },
    PerformAction {
        element_index: usize,
        action: String,
    },
}

fn target(element_index: Option<usize>, x: Option<f64>, y: Option<f64>) -> Option<ClickTarget> {
    match (element_index, x, y) {
        (Some(index), _, _) => Some(ClickTarget::Element(index)),
        (None, Some(x), Some(y)) => Some(ClickTarget::Pixel { x, y }),
        _ => None,
    }
}

fn label(computer: &NativeComputer, key: &str, index: usize) -> String {
    let element = computer.state(key).and_then(|state| state.element(index));
    match element {
        Some(e) => match e.label().filter(|l| !l.is_empty()) {
            Some(text) => format!("[{index}] {} \"{text}\"", e.role),
            None => format!("[{index}] {}", e.role),
        },
        None => format!("[{index}]"),
    }
}

fn describe_target(computer: &NativeComputer, key: &str, target: &ClickTarget) -> String {
    match target {
        ClickTarget::Element(index) => label(computer, key, *index),
        ClickTarget::Pixel { x, y } | ClickTarget::Screen { x, y } => format!("({x}, {y})"),
        _ => "the target".to_string(),
    }
}

fn selection_mode(mode: Option<&str>) -> Result<SelectionMode, String> {
    match mode.map(|m| m.trim().to_ascii_lowercase()).as_deref() {
        None | Some("select") | Some("text") => Ok(SelectionMode::Text),
        Some("before") => Ok(SelectionMode::CursorBefore),
        Some("after") => Ok(SelectionMode::CursorAfter),
        Some(other) => Err(format!("Unknown selection mode \"{other}\"")),
    }
}

pub fn act(
    computer: &mut NativeComputer,
    query: &str,
    action: ComputerAction,
) -> Result<String, String> {
    if matches!(action, ComputerAction::OpenApp) {
        return apps::open(computer, query);
    }

    let (_, key) = apps::find_running(computer, query)?;
    let key = key.as_str();

    let message = match action {
        ComputerAction::OpenApp => unreachable!(),
        ComputerAction::Click {
            element_index,
            x,
            y,
            button,
            click_count,
        } => {
            let target = target(element_index, x, y)
                .ok_or("Provide either elementIndex or both x and y.")?;
            let button: MouseButton = button
                .as_deref()
                .unwrap_or("left")
                .parse()
                .map_err(describe_error)?;
            let count = click_count.unwrap_or(1).clamp(1, 3);
            let described = describe_target(computer, key, &target);
            let outcome = computer
                .click(
                    key,
                    target,
                    ClickOptions::default().button(button).count(count),
                )
                .map_err(describe_error)?;
            match outcome {
                ClickOutcome::Action(name) => {
                    format!("Clicked {described} with its \"{name}\" action.")
                }
                _ => format!("Clicked {described}."),
            }
        }
        ComputerAction::TypeText {
            text,
            element_index,
        } => {
            if let Some(index) = element_index {
                computer
                    .click(key, ClickTarget::Element(index), ClickOptions::default())
                    .map_err(describe_error)?;
            }
            computer.type_text(key, &text).map_err(describe_error)?;
            format!("Typed {} characters.", text.chars().count())
        }
        ComputerAction::PressKey { key: chord } => {
            computer.press_key(key, &chord).map_err(describe_error)?;
            format!("Pressed {chord}.")
        }
        ComputerAction::Scroll {
            direction,
            pages,
            element_index,
            x,
            y,
        } => {
            let parsed: ScrollDirection = direction.parse().map_err(describe_error)?;
            let pages = pages.unwrap_or(DEFAULT_SCROLL_PAGES).clamp(0.1, 20.0);
            let target = match target(element_index, x, y) {
                Some(target) => target,
                None => {
                    let state = computer
                        .state(key)
                        .ok_or("Observe the app before scrolling it.")?;
                    let center = state.window.frame.center();
                    ClickTarget::Screen {
                        x: center.x,
                        y: center.y,
                    }
                }
            };
            computer
                .scroll_at(key, target, parsed, pages)
                .map_err(describe_error)?;
            format!("Scrolled {direction} by {pages} pages.")
        }
        ComputerAction::Drag {
            from_x,
            from_y,
            to_x,
            to_y,
        } => {
            computer
                .drag(key, (from_x, from_y), (to_x, to_y))
                .map_err(describe_error)?;
            format!("Dragged from ({from_x}, {from_y}) to ({to_x}, {to_y}).")
        }
        ComputerAction::SetValue {
            element_index,
            value,
        } => {
            computer
                .set_value(key, element_index, &value)
                .map_err(describe_error)?;
            format!("Set the value of {}.", label(computer, key, element_index))
        }
        ComputerAction::SelectText {
            element_index,
            text,
            prefix,
            suffix,
            mode,
        } => {
            let mode = selection_mode(mode.as_deref())?;
            let mut selection = TextSelection::new(text).mode(mode);
            if let Some(prefix) = prefix {
                selection = selection.prefix(prefix);
            }
            if let Some(suffix) = suffix {
                selection = selection.suffix(suffix);
            }
            computer
                .select_text(key, element_index, &selection)
                .map_err(describe_error)?;
            format!(
                "Updated the selection in {}.",
                label(computer, key, element_index)
            )
        }
        ComputerAction::PerformAction {
            element_index,
            action,
        } => {
            computer
                .perform_secondary_action(key, element_index, &action)
                .map_err(describe_error)?;
            format!(
                "Performed \"{action}\" on {}.",
                label(computer, key, element_index)
            )
        }
    };

    Ok(message)
}
