use std::thread::sleep;
use std::time::Duration;

use serde::Deserialize;
use xa11y::{ClickOptions, ClickTarget, Error, MouseButton, ScrollDelta};

use super::state::{element_center, snapshots, visible_center};
use super::{activate, apps, describe_error, keys};

const SETTLE_DELAY: Duration = Duration::from_millis(200);
const AX_ERROR_CANNOT_COMPLETE: i64 = -25204;

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
        x: Option<i32>,
        y: Option<i32>,
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
        amount: Option<i32>,
        element_index: Option<usize>,
        x: Option<i32>,
        y: Option<i32>,
    },
    Drag {
        from_x: i32,
        from_y: i32,
        to_x: i32,
        to_y: i32,
    },
    SetValue {
        element_index: usize,
        value: String,
    },
    PerformAction {
        element_index: usize,
        action: String,
    },
}

fn parse_button(button: Option<&str>) -> Result<MouseButton, String> {
    match button.unwrap_or("left").to_ascii_lowercase().as_str() {
        "left" | "l" => Ok(MouseButton::Left),
        "right" | "r" => Ok(MouseButton::Right),
        "middle" | "m" => Ok(MouseButton::Middle),
        other => Err(format!("Unknown mouse button \"{other}\"")),
    }
}

// xa11y's horizontal scroll axis points left on macOS and right on Windows.
const SCROLL_RIGHT: i32 = if cfg!(target_os = "macos") { -1 } else { 1 };

fn scroll_delta(direction: &str, amount: i32) -> Result<ScrollDelta, String> {
    match direction.to_ascii_lowercase().as_str() {
        "up" | "u" => Ok(ScrollDelta::vertical(amount)),
        "down" | "d" => Ok(ScrollDelta::vertical(-amount)),
        "left" | "l" => Ok(ScrollDelta::horizontal(-amount * SCROLL_RIGHT)),
        "right" | "r" => Ok(ScrollDelta::horizontal(amount * SCROLL_RIGHT)),
        other => Err(format!("Unknown scroll direction \"{other}\"")),
    }
}

pub fn act(query: &str, action: ComputerAction) -> Result<String, String> {
    if matches!(action, ComputerAction::OpenApp) {
        return apps::open(query);
    }

    let app = apps::find_running(query)?;
    let pid = app
        .pid
        .ok_or_else(|| "The app has no process id.".to_string())?;
    let snapshots = snapshots();
    let snapshot = snapshots.get(&pid).ok_or_else(|| {
        format!(
            "Observe \"{}\" before acting on it so element indexes are known.",
            app.name
        )
    })?;
    let window = snapshot.window.as_ref();
    let input = || xa11y::input_sim().map_err(describe_error);

    let message = match action {
        ComputerAction::OpenApp => unreachable!(),
        ComputerAction::Click {
            element_index,
            x,
            y,
            button,
            click_count,
        } => {
            let button = parse_button(button.as_deref())?;
            let count = click_count.unwrap_or(1).clamp(1, 3);

            let pressed = match element_index {
                Some(index) if button == MouseButton::Left && count == 1 => {
                    let element = snapshot.element(index)?;
                    element.actions.iter().any(|a| a == "press")
                        && match element.press() {
                            Ok(()) => true,
                            // The app is still handling the press (e.g. it opened a modal).
                            Err(Error::Platform { code, .. }) => code == AX_ERROR_CANNOT_COMPLETE,
                            Err(_) => false,
                        }
                }
                _ => false,
            };

            if !pressed {
                let point = snapshot.target_point(element_index, x, y)?;
                activate(window);
                input()?
                    .mouse()
                    .click_with(
                        ClickTarget::from(point),
                        ClickOptions::new().button(button).count(count),
                    )
                    .map_err(describe_error)?;
            }

            match element_index {
                Some(index) => format!("Clicked {}.", snapshot.label(index)),
                None => format!("Clicked at ({}, {}).", x.unwrap_or(0), y.unwrap_or(0)),
            }
        }
        ComputerAction::TypeText {
            text,
            element_index,
        } => {
            let typed = match element_index {
                Some(index) => {
                    let element = snapshot.element(index)?;
                    element.focus().is_ok() && element.type_text(&text).is_ok()
                }
                None => false,
            };
            if !typed {
                activate(window);
                input()?
                    .keyboard()
                    .type_text(&text)
                    .map_err(describe_error)?;
            }
            format!("Typed {} characters.", text.chars().count())
        }
        ComputerAction::PressKey { key } => {
            let chord = keys::parse_chord(&key)?;
            activate(window);
            let sim = input()?;
            let keyboard = sim.keyboard();
            if chord.held.is_empty() {
                keyboard.press(chord.key).map_err(describe_error)?;
            } else {
                keyboard
                    .chord(chord.key, &chord.held)
                    .map_err(describe_error)?;
            }
            format!("Pressed {key}.")
        }
        ComputerAction::Scroll {
            direction,
            amount,
            element_index,
            x,
            y,
        } => {
            let amount = amount.unwrap_or(5).clamp(1, 50);
            let delta = scroll_delta(&direction, amount)?;
            let point = match (element_index, x, y) {
                (None, None, None) => {
                    element_center(window.ok_or("The app has no window to scroll.")?)?
                }
                (Some(index), _, _) => visible_center(snapshot.element(index)?, window)?,
                _ => snapshot.target_point(element_index, x, y)?,
            };
            activate(window);
            input()?
                .mouse()
                .scroll(point, delta)
                .map_err(describe_error)?;
            format!("Scrolled {direction} by {amount}.")
        }
        ComputerAction::Drag {
            from_x,
            from_y,
            to_x,
            to_y,
        } => {
            let from = snapshot.screenshot_point(from_x, from_y)?;
            let to = snapshot.screenshot_point(to_x, to_y)?;
            activate(window);
            input()?.mouse().drag(from, to).map_err(describe_error)?;
            format!("Dragged from ({from_x}, {from_y}) to ({to_x}, {to_y}).")
        }
        ComputerAction::SetValue {
            element_index,
            value,
        } => {
            snapshot
                .element(element_index)?
                .set_value(&value)
                .map_err(describe_error)?;
            format!("Set the value of {}.", snapshot.label(element_index))
        }
        ComputerAction::PerformAction {
            element_index,
            action,
        } => {
            let name = action.trim().to_lowercase().replace([' ', '-'], "_");
            snapshot
                .element(element_index)?
                .perform_action(&name)
                .map_err(describe_error)?;
            format!("Performed \"{name}\" on {}.", snapshot.label(element_index))
        }
    };

    drop(snapshots);
    sleep(SETTLE_DELAY);
    Ok(message)
}
