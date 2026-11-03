interface HtmlPreviewProps {
  content: string;
  complete?: boolean;
}

export const HtmlPreview = ({ content, complete = true }: HtmlPreviewProps) => {
  if (!complete) {
    return (
      <div className="flex h-32 items-center justify-center border-2 border-solid border-[rgb(30,30,30)]">
        <span className="shimmer shimmer-with-pause shimmer-spread-2 shimmer-duration-1000 dark:text-muted-foreground text-foreground text-sm font-bold [--shimmer-pause:1000ms]">
          Generating preview
        </span>
      </div>
    );
  }

  return (
    <iframe
      srcDoc={content}
      title="HTML Preview"
      className="h-96 w-full rounded-b-md border-2 border-solid border-[rgb(30,30,30)] bg-white"
      sandbox="allow-scripts allow-forms allow-popups allow-modals allow-same-origin"
    />
  );
};

HtmlPreview.displayName = "HtmlPreview";
