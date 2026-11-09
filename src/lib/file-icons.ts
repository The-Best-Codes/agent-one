import {
  type Icon,
  IconBrandCSharp,
  IconBrandCpp,
  IconBrandDocker,
  IconBrandGit,
  IconBrandGolang,
  IconBrandKotlin,
  IconBrandPython,
  IconBrandRust,
  IconBrandSwift,
  IconCoffee,
  IconFile,
  IconFileCode,
  IconFileText,
  IconFileTypeCss,
  IconFileTypeCsv,
  IconFileTypeDoc,
  IconFileTypeDocx,
  IconFileTypeHtml,
  IconFileTypeJs,
  IconFileTypeJsx,
  IconFileTypePdf,
  IconFileTypePhp,
  IconFileTypePpt,
  IconFileTypeSql,
  IconFileTypeSvg,
  IconFileTypeTs,
  IconFileTypeTsx,
  IconFileTypeVue,
  IconFileTypeXls,
  IconFileTypeXml,
  IconFileZip,
  IconFolder,
  IconJson,
  IconLock,
  IconMarkdown,
  IconMovie,
  IconMusic,
  IconPhoto,
  IconSettings,
  IconTerminal2,
} from "@tabler/icons-react";

const ICON_EXTENSIONS: [Icon, string[]][] = [
  [IconFileTypeTs, ["ts", "mts", "cts"]],
  [IconFileTypeTsx, ["tsx"]],
  [IconFileTypeJs, ["js", "mjs", "cjs"]],
  [IconFileTypeJsx, ["jsx"]],
  [IconFileTypeCss, ["css", "scss", "sass", "less"]],
  [IconFileTypeHtml, ["html", "htm"]],
  [IconFileTypeVue, ["vue"]],
  [IconFileCode, ["svelte", "rb", "lua", "dart"]],
  [IconFileTypePhp, ["php"]],
  [IconFileTypeSql, ["sql"]],
  [IconFileTypeSvg, ["svg"]],
  [IconFileTypeXml, ["xml", "plist"]],
  [IconJson, ["json", "jsonc", "json5"]],
  [IconMarkdown, ["md", "mdx", "markdown"]],
  [IconFileText, ["txt", "log", "rtf"]],
  [IconFileTypeCsv, ["csv", "tsv"]],
  [IconFileTypePdf, ["pdf"]],
  [IconFileTypeDoc, ["doc"]],
  [IconFileTypeDocx, ["docx"]],
  [IconFileTypeXls, ["xls", "xlsx"]],
  [IconFileTypePpt, ["ppt", "pptx"]],
  [IconBrandPython, ["py"]],
  [IconBrandRust, ["rs"]],
  [IconBrandGolang, ["go"]],
  [IconBrandSwift, ["swift"]],
  [IconBrandKotlin, ["kt", "kts"]],
  [IconCoffee, ["java"]],
  [IconBrandCpp, ["c", "h", "cpp", "cc", "hpp"]],
  [IconBrandCSharp, ["cs"]],
  [IconTerminal2, ["sh", "bash", "zsh", "fish", "ps1", "bat"]],
  [IconSettings, ["yml", "yaml", "toml", "ini", "env", "conf"]],
  [IconLock, ["lock"]],
  [IconPhoto, ["png", "jpg", "jpeg", "gif", "webp", "avif", "bmp", "ico", "icns"]],
  [IconMovie, ["mp4", "mov", "webm", "mkv"]],
  [IconMusic, ["mp3", "wav", "flac", "ogg", "m4a"]],
  [IconFileZip, ["zip", "tar", "gz", "tgz", "rar", "7z"]],
];

const ICONS_BY_EXTENSION = new Map(
  ICON_EXTENSIONS.flatMap(([icon, extensions]) => extensions.map((extension) => [extension, icon])),
);

const ICONS_BY_NAME: Record<string, Icon> = {
  dockerfile: IconBrandDocker,
  makefile: IconTerminal2,
  ".gitignore": IconBrandGit,
  ".gitattributes": IconBrandGit,
  ".env": IconSettings,
};

export function getFileName(path: string): string {
  const trimmed = path.replace(/[/\\]+$/, "");
  return trimmed.slice(Math.max(trimmed.lastIndexOf("/"), trimmed.lastIndexOf("\\")) + 1);
}

export function getFileIcon(path: string): Icon {
  if (/[/\\]$/.test(path)) return IconFolder;
  const name = getFileName(path).toLowerCase();
  const byName = ICONS_BY_NAME[name];
  if (byName) return byName;
  const dot = name.lastIndexOf(".");
  return (dot > 0 && ICONS_BY_EXTENSION.get(name.slice(dot + 1))) || IconFile;
}
