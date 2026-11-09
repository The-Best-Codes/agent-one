import brandCSharp from "@tabler/icons/outline/brand-c-sharp.svg?raw";
import brandCpp from "@tabler/icons/outline/brand-cpp.svg?raw";
import brandDocker from "@tabler/icons/outline/brand-docker.svg?raw";
import brandGit from "@tabler/icons/outline/brand-git.svg?raw";
import brandGolang from "@tabler/icons/outline/brand-golang.svg?raw";
import brandKotlin from "@tabler/icons/outline/brand-kotlin.svg?raw";
import brandPython from "@tabler/icons/outline/brand-python.svg?raw";
import brandRust from "@tabler/icons/outline/brand-rust.svg?raw";
import brandSwift from "@tabler/icons/outline/brand-swift.svg?raw";
import coffee from "@tabler/icons/outline/coffee.svg?raw";
import fileCode from "@tabler/icons/outline/file-code.svg?raw";
import fileText from "@tabler/icons/outline/file-text.svg?raw";
import fileTypeCss from "@tabler/icons/outline/file-type-css.svg?raw";
import fileTypeCsv from "@tabler/icons/outline/file-type-csv.svg?raw";
import fileTypeDoc from "@tabler/icons/outline/file-type-doc.svg?raw";
import fileTypeDocx from "@tabler/icons/outline/file-type-docx.svg?raw";
import fileTypeHtml from "@tabler/icons/outline/file-type-html.svg?raw";
import fileTypeJs from "@tabler/icons/outline/file-type-js.svg?raw";
import fileTypeJsx from "@tabler/icons/outline/file-type-jsx.svg?raw";
import fileTypePdf from "@tabler/icons/outline/file-type-pdf.svg?raw";
import fileTypePhp from "@tabler/icons/outline/file-type-php.svg?raw";
import fileTypePpt from "@tabler/icons/outline/file-type-ppt.svg?raw";
import fileTypeSql from "@tabler/icons/outline/file-type-sql.svg?raw";
import fileTypeSvg from "@tabler/icons/outline/file-type-svg.svg?raw";
import fileTypeTs from "@tabler/icons/outline/file-type-ts.svg?raw";
import fileTypeTsx from "@tabler/icons/outline/file-type-tsx.svg?raw";
import fileTypeVue from "@tabler/icons/outline/file-type-vue.svg?raw";
import fileTypeXls from "@tabler/icons/outline/file-type-xls.svg?raw";
import fileTypeXml from "@tabler/icons/outline/file-type-xml.svg?raw";
import fileZip from "@tabler/icons/outline/file-zip.svg?raw";
import file from "@tabler/icons/outline/file.svg?raw";
import folder from "@tabler/icons/outline/folder.svg?raw";
import json from "@tabler/icons/outline/json.svg?raw";
import lock from "@tabler/icons/outline/lock.svg?raw";
import markdown from "@tabler/icons/outline/markdown.svg?raw";
import messageCircle from "@tabler/icons/outline/message-circle.svg?raw";
import movie from "@tabler/icons/outline/movie.svg?raw";
import music from "@tabler/icons/outline/music.svg?raw";
import photo from "@tabler/icons/outline/photo.svg?raw";
import settings from "@tabler/icons/outline/settings.svg?raw";
import sparkles from "@tabler/icons/outline/sparkles.svg?raw";
import terminal from "@tabler/icons/outline/terminal-2.svg?raw";

export const SKILL_ICON_SVG = sparkles;
export const CHAT_ICON_SVG = messageCircle;

const ICON_EXTENSIONS: [string, string[]][] = [
  [fileTypeTs, ["ts", "mts", "cts"]],
  [fileTypeTsx, ["tsx"]],
  [fileTypeJs, ["js", "mjs", "cjs"]],
  [fileTypeJsx, ["jsx"]],
  [fileTypeCss, ["css", "scss", "sass", "less"]],
  [fileTypeHtml, ["html", "htm"]],
  [fileTypeVue, ["vue"]],
  [fileCode, ["svelte", "rb", "lua", "dart"]],
  [fileTypePhp, ["php"]],
  [fileTypeSql, ["sql"]],
  [fileTypeSvg, ["svg"]],
  [fileTypeXml, ["xml", "plist"]],
  [json, ["json", "jsonc", "json5"]],
  [markdown, ["md", "mdx", "markdown"]],
  [fileText, ["txt", "log", "rtf"]],
  [fileTypeCsv, ["csv", "tsv"]],
  [fileTypePdf, ["pdf"]],
  [fileTypeDoc, ["doc"]],
  [fileTypeDocx, ["docx"]],
  [fileTypeXls, ["xls", "xlsx"]],
  [fileTypePpt, ["ppt", "pptx"]],
  [brandPython, ["py"]],
  [brandRust, ["rs"]],
  [brandGolang, ["go"]],
  [brandSwift, ["swift"]],
  [brandKotlin, ["kt", "kts"]],
  [coffee, ["java"]],
  [brandCpp, ["c", "h", "cpp", "cc", "hpp"]],
  [brandCSharp, ["cs"]],
  [terminal, ["sh", "bash", "zsh", "fish", "ps1", "bat"]],
  [settings, ["yml", "yaml", "toml", "ini", "env", "conf"]],
  [lock, ["lock"]],
  [photo, ["png", "jpg", "jpeg", "gif", "webp", "avif", "bmp", "ico", "icns"]],
  [movie, ["mp4", "mov", "webm", "mkv"]],
  [music, ["mp3", "wav", "flac", "ogg", "m4a"]],
  [fileZip, ["zip", "tar", "gz", "tgz", "rar", "7z"]],
];

const ICONS_BY_EXTENSION = new Map(
  ICON_EXTENSIONS.flatMap(([icon, extensions]) => extensions.map((extension) => [extension, icon])),
);

const ICONS_BY_NAME = new Map([
  ["dockerfile", brandDocker],
  ["makefile", terminal],
  [".gitignore", brandGit],
  [".gitattributes", brandGit],
  [".env", settings],
]);

export function getFileName(path: string): string {
  const trimmed = path.replace(/[/\\]+$/, "");
  return trimmed.slice(Math.max(trimmed.lastIndexOf("/"), trimmed.lastIndexOf("\\")) + 1);
}

export function getFileIconSvg(path: string): string {
  if (/[/\\]$/.test(path)) return folder;
  const name = getFileName(path).toLowerCase();
  const byName = ICONS_BY_NAME.get(name);
  if (byName) return byName;
  const dot = name.lastIndexOf(".");
  return (dot > 0 && ICONS_BY_EXTENSION.get(name.slice(dot + 1))) || file;
}
