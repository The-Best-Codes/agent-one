use htmd::{element_handler::Handlers, Element, HtmlToMarkdown};
use once_cell::sync::Lazy;
use regex::Regex;

static BLANK_LINE_REGEX: Lazy<Regex> = Lazy::new(|| Regex::new(r"\n\s*\n\s*\n+").unwrap());

const NORMAL_URL_LIMIT: usize = 2_000;
const DATA_URL_LIMIT: usize = 200;
const SVG_PLACEHOLDER: &str = "[SVG Image]";

pub fn convert_html_to_markdown(html: &str) -> Result<String, String> {
    let converter = HtmlToMarkdown::builder()
        .skip_tags(vec!["script", "style", "link", "meta"])
        .add_handler(vec!["svg"], |_: &dyn Handlers, _: Element| {
            Some(SVG_PLACEHOLDER.into())
        })
        .add_handler(vec!["img"], |_: &dyn Handlers, element: Element| {
            image_to_markdown(element).map(Into::into)
        })
        .build();

    let markdown_output = converter
        .convert(html)
        .map_err(|e| format!("Failed to convert HTML to markdown: {e}"))?;

    Ok(normalize_markdown(markdown_output))
}

pub fn truncate_content(content: String, max_length: usize) -> (String, bool) {
    if content.len() <= max_length {
        return (content, false);
    }

    let mut byte_idx = 0;
    for (idx, _) in content.char_indices() {
        if idx >= max_length {
            break;
        }
        byte_idx = idx;
    }

    if byte_idx == 0 && max_length > 0 && !content.is_empty() {
        byte_idx = content.chars().next().unwrap().len_utf8();
        if byte_idx > max_length {
            byte_idx = max_length;
        }
    }

    let truncated = format!(
        "{}...\n\n[Content truncated at {max_length} bytes]",
        &content[..byte_idx]
    );

    (truncated, true)
}

fn normalize_markdown(markdown: String) -> String {
    BLANK_LINE_REGEX.replace_all(&markdown, "\n\n").to_string()
}

fn image_to_markdown(element: Element) -> Option<String> {
    let mut src = None;
    let mut alt = None;
    let mut title = None;

    for attr in element.attrs {
        match attr.name.local.as_ref() {
            "src" | "href" => src = Some(attr.value.to_string()),
            "alt" => alt = Some(normalize_image_text(attr.value.as_ref())),
            "title" => title = Some(normalize_image_text(attr.value.as_ref())),
            _ => {}
        }
    }

    let src = truncate_attribute_value(&src?);
    let src = src.replace('(', "\\(").replace(')', "\\)");
    let has_spaces = src.contains(' ');

    let mut markdown = String::from("![");
    markdown.push_str(alt.as_deref().unwrap_or(""));
    markdown.push_str("](");
    if has_spaces {
        markdown.push('<');
    }
    markdown.push_str(&src);
    if has_spaces {
        markdown.push('>');
    }
    if let Some(title) = title.filter(|title| !title.is_empty()) {
        markdown.push_str(" \"");
        markdown.push_str(&title);
        markdown.push('"');
    }
    markdown.push(')');

    Some(markdown)
}

fn truncate_attribute_value(value: &str) -> String {
    let limit = if value.starts_with("data:") {
        DATA_URL_LIMIT
    } else {
        NORMAL_URL_LIMIT
    };

    truncate_with_suffix(value, limit)
}

fn truncate_with_suffix(value: &str, limit: usize) -> String {
    if value.len() <= limit {
        return value.to_string();
    }

    let mut cutoff = 0;
    for (idx, _) in value.char_indices() {
        if idx >= limit {
            break;
        }
        cutoff = idx;
    }

    if cutoff == 0 && limit > 0 && !value.is_empty() {
        cutoff = value.chars().next().unwrap().len_utf8().min(limit);
    }

    format!("{}... [truncated]", &value[..cutoff])
}

fn normalize_image_text(text: &str) -> String {
    text.lines()
        .map(str::trim)
        .filter(|line| !line.is_empty())
        .map(|line| line.replace('"', "\\\""))
        .collect::<Vec<_>>()
        .join("\n")
}
