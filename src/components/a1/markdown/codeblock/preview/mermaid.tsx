import { useEffect, useId, useState } from "react";

interface MermaidPreviewProps {
  content: string;
  complete?: boolean;
}

type RenderState = { svg: string; error?: undefined } | { svg?: undefined; error: string };

export const MermaidPreview = ({ content, complete = true }: MermaidPreviewProps) => {
  const idPrefix = useId().replace(/:/g, "");
  const [state, setState] = useState<RenderState | null>(null);

  useEffect(() => {
    if (!complete) return;
    let cancelled = false;

    import("pele/lazy")
      .then(({ renderAsync }) => renderAsync(content, { idPrefix, links: false, images: false }))
      .then(
        ({ svg }) => {
          if (!cancelled) setState({ svg });
        },
        (error: unknown) => {
          if (!cancelled) {
            setState({ error: error instanceof Error ? error.message : String(error) });
          }
        },
      );

    return () => {
      cancelled = true;
    };
  }, [complete, content, idPrefix]);

  if (!complete || !state) {
    return (
      <div className="flex h-32 items-center justify-center">
        <span className="shimmer shimmer-with-pause shimmer-spread-2 shimmer-duration-1000 dark:text-muted-foreground text-foreground text-sm font-bold [--shimmer-pause:1000ms]">
          Generating diagram
        </span>
      </div>
    );
  }

  if (state.svg === undefined) {
    return <div className="text-destructive p-4 font-mono text-xs">{state.error}</div>;
  }

  return (
    <div
      className="mermaid-preview flex justify-center p-4"
      dangerouslySetInnerHTML={{ __html: state.svg }}
    />
  );
};

MermaidPreview.displayName = "MermaidPreview";
