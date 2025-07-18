import { cn } from "@/lib/utils";
import type { UIMessage } from "ai";

export const MessageGroup = ({
  children,
  messageRole,
}: {
  children: React.ReactNode;
  messageRole: UIMessage["role"];
}) => {
  return (
    <div
      className={cn(
        "flex flex-col rounded-md p-2",
        messageRole === "user"
          ? "bg-secondary text-secondary-foreground max-w-3/4"
          : "max-w-full",
      )}
    >
      {children}
    </div>
  );
};
