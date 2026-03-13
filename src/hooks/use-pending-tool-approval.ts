import { useMemo } from "react";

import { useChatMessages } from "@/contexts/use-chat/chat-hooks";

export const usePendingToolApproval = () => {
  const messages = useChatMessages();

  return useMemo(
    () =>
      messages
        .at(-1)
        ?.parts.some(
          (part) =>
            part.type.startsWith("tool-") && "state" in part && part.state === "approval-requested",
        ) ?? false,
    [messages],
  );
};
