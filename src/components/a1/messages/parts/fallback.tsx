export const MessagePartFallback = ({ ...props }: any) => {
  return (
    <div className="max-w-full overflow-auto rounded-md bg-destructive text-destructive-foreground flex flex-col">
      <span>Unknown message part:</span>
      <pre className="font-mono">{JSON.stringify(props)}</pre>
    </div>
  );
};
