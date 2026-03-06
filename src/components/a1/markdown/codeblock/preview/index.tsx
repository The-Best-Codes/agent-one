import { useState } from "react";

import { HtmlPreview } from "./html";

const previewRegistry: Record<string, React.ComponentType<{ content: string }>> = {
  html: HtmlPreview,
};

export const usePreview = (lang?: string) => {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const PreviewComponent = lang ? previewRegistry[lang] : undefined;
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

export type PreviewComponent = React.ComponentType<{ content: string }>;

export const registerPreview = (lang: string, component: PreviewComponent) => {
  previewRegistry[lang] = component;
};
