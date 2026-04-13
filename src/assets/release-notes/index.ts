const releaseNoteFiles = import.meta.glob("./*.md", {
  eager: true,
  import: "default",
  query: "?raw",
}) as Record<string, string>;

const releaseNotesByVersion = Object.entries(releaseNoteFiles).reduce<Record<string, string>>(
  (notes, [path, content]) => {
    const version = path.match(/\/([^/]+)\.md$/)?.[1];

    if (version) {
      notes[version] = content.trim();
    }

    return notes;
  },
  {},
);

export function getReleaseNotes(version: string) {
  return releaseNotesByVersion[version] ?? null;
}
