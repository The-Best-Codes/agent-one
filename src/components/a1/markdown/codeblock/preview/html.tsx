interface HtmlPreviewProps {
  content: string;
}

export const HtmlPreview = ({ content }: HtmlPreviewProps) => {
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
