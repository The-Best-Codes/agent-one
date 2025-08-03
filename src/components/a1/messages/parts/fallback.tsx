// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const MessagePartFallback = ({ ...props }: any) => {
  return (
    <div className="max-w-full rounded-md bg-destructive text-destructive-foreground flex flex-col">
      <span>Unknown message part:</span>
      <pre className="font-mono">{JSON.stringify(props)}</pre>
    </div>
  );
};
