use xa11y::Key;

pub struct KeyChord {
    pub key: Key,
    pub held: Vec<Key>,
}

fn parse_modifier(name: &str) -> Option<Key> {
    match name {
        "shift" => Some(Key::Shift),
        "ctrl" | "control" | "ctl" => Some(Key::Ctrl),
        "alt" | "option" | "opt" => Some(Key::Alt),
        "cmd" | "command" | "meta" | "super" | "win" | "windows" => Some(Key::Meta),
        _ => None,
    }
}

fn parse_symbol(name: &str) -> Option<char> {
    let c = match name {
        "period" | "dot" => '.',
        "comma" => ',',
        "slash" => '/',
        "backslash" => '\\',
        "minus" | "hyphen" => '-',
        "equal" | "equals" => '=',
        "semicolon" => ';',
        "apostrophe" | "quote" => '\'',
        "grave" | "backtick" => '`',
        "bracketleft" => '[',
        "bracketright" => ']',
        _ => return None,
    };
    Some(c)
}

fn hold_shift(held: &mut Vec<Key>) {
    if !held.contains(&Key::Shift) {
        held.push(Key::Shift);
    }
}

fn parse_key(raw: &str, held: &mut Vec<Key>) -> Result<Key, String> {
    if raw == "+" || raw.eq_ignore_ascii_case("plus") {
        hold_shift(held);
        return Ok(Key::Char('='));
    }

    let mut chars = raw.chars();
    if let (Some(c), None) = (chars.next(), chars.next()) {
        if c.is_ascii_uppercase() {
            hold_shift(held);
            return Ok(Key::Char(c.to_ascii_lowercase()));
        }
        return Ok(Key::Char(c));
    }

    let name = raw.to_ascii_lowercase().replace(['_', '-', ' '], "");
    let key = match name.as_str() {
        "enter" | "return" | "kpenter" => Key::Enter,
        "escape" | "esc" => Key::Escape,
        "backspace" => Key::Backspace,
        "tab" => Key::Tab,
        "space" | "spacebar" => Key::Space,
        "delete" | "del" => Key::Delete,
        "insert" | "ins" => Key::Insert,
        "up" | "arrowup" => Key::ArrowUp,
        "down" | "arrowdown" => Key::ArrowDown,
        "left" | "arrowleft" => Key::ArrowLeft,
        "right" | "arrowright" => Key::ArrowRight,
        "home" => Key::Home,
        "end" => Key::End,
        "pageup" | "prior" => Key::PageUp,
        "pagedown" | "next" => Key::PageDown,
        _ => {
            if let Some(n) = name.strip_prefix('f').and_then(|n| n.parse::<u8>().ok()) {
                if (1..=24).contains(&n) {
                    return Ok(Key::F(n));
                }
            }
            if let Some(digit) = name.strip_prefix("kp").filter(|d| d.len() == 1) {
                return Ok(Key::Char(digit.chars().next().unwrap_or('0')));
            }
            if let Some(c) = parse_symbol(&name) {
                return Ok(Key::Char(c));
            }
            if let Some(modifier) = parse_modifier(trim_side(&name)) {
                return Ok(modifier);
            }
            return Err(format!("Unknown key \"{raw}\""));
        }
    };
    Ok(key)
}

fn trim_side(name: &str) -> &str {
    name.strip_suffix('l')
        .or_else(|| name.strip_suffix('r'))
        .filter(|base| parse_modifier(base).is_some())
        .unwrap_or(name)
}

pub fn parse_chord(input: &str) -> Result<KeyChord, String> {
    let input = input.trim();
    let (input, plus) = match input.strip_suffix('+') {
        Some(rest) if rest.is_empty() || rest.trim_end().ends_with('+') => (rest, true),
        _ => (input, false),
    };
    let mut parts: Vec<&str> = input
        .split('+')
        .map(str::trim)
        .filter(|p| !p.is_empty())
        .collect();
    if plus {
        parts.push("+");
    }
    let Some((last, modifiers)) = parts.split_last() else {
        return Err("Key must not be empty".to_string());
    };

    let mut held = Vec::new();
    for raw in modifiers {
        let name = raw.to_ascii_lowercase().replace(['_', '-', ' '], "");
        let modifier = parse_modifier(trim_side(&name))
            .ok_or_else(|| format!("Unknown modifier \"{raw}\""))?;
        if !held.contains(&modifier) {
            held.push(modifier);
        }
    }

    let key = parse_key(last, &mut held)?;
    Ok(KeyChord { key, held })
}
