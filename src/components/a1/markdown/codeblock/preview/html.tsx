interface HtmlPreviewProps {
  content: string;
}

export const HtmlPreview = ({ content }: HtmlPreviewProps) => {
  return (
    <iframe
      srcDoc={content}
      title="HTML Preview"
      className="w-full rounded-b-md h-96 border-[rgb(30,30,30)] border-solid border-2 bg-white"
      sandbox="allow-scripts allow-forms allow-popups allow-modals allow-same-origin"
    />
  );
};

HtmlPreview.displayName = "HtmlPreview";
