// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const MessagePartFallback = ({ ...props }: any) => {
  return (
    <div className="bg-destructive text-destructive-foreground flex max-w-full flex-col rounded-md">
      <span>Unknown message part:</span>
      <pre className="font-mono">{JSON.stringify(props)}</pre>
    </div>
  );
};
