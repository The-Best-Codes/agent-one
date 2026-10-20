import { useState } from "react";

import { HtmlPreview } from "./html";
import { MermaidPreview } from "./mermaid";

type PreviewEntry = {
  component: PreviewComponent;
  defaultEnabled?: boolean;
};

const previewRegistry: Record<string, PreviewEntry> = {
  html: { component: HtmlPreview },
  mermaid: { component: MermaidPreview, defaultEnabled: true },
};

export const usePreview = (lang?: string) => {
  const entry = lang ? previewRegistry[lang.toLowerCase()] : undefined;
  const [isPreviewMode, setIsPreviewMode] = useState(entry?.defaultEnabled ?? false);
  const PreviewComponent = entry?.component;
  const isSupported = Boolean(PreviewComponent);

  const togglePreview = () => {
    setIsPreviewMode((prev) => !prev);
  };

  return {
    isPreviewMode,
    togglePreview,
    PreviewComponent,
    isSupported,
  };
};

export type PreviewComponent = React.ComponentType<{ content: string; complete?: boolean }>;

export const registerPreview = (
  lang: string,
  component: PreviewComponent,
  options?: { defaultEnabled?: boolean },
) => {
  previewRegistry[lang] = { component, ...options };
};
