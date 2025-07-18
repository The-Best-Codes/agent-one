export const MessagePartsGroup = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <div className="bg-secondary text-secondary-foreground flex flex-col rounded-md max-w-3/4 p-2">
      {children}
    </div>
  );
};
