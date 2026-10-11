import { IconBulb } from "@tabler/icons-react";
import { Link, useSearchParams } from "react-router";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function ToolsIntro() {
  const [searchParams] = useSearchParams();
  const chatId = searchParams.get("chatId");

  return (
    <Alert>
      <IconBulb />
      <AlertTitle>Add more tools</AlertTitle>
      <AlertDescription>
        Browse{" "}
        <Link to={`/extensions${chatId ? `?chatId=${encodeURIComponent(chatId)}` : ""}`}>
          Extensions
        </Link>{" "}
        to add more tools and capabilities.
      </AlertDescription>
    </Alert>
  );
}
