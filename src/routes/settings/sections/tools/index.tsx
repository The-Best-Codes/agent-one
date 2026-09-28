import { IconBulb } from "@tabler/icons-react";
import { Link, useSearchParams } from "react-router";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { ToolRow } from "./tool-row";
import { TOOL_GROUPS } from "./tools-metadata";

export default function ToolsSection() {
  const [searchParams] = useSearchParams();
  const chatId = searchParams.get("chatId");

  return (
    <div className="flex flex-col gap-6">
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
      {TOOL_GROUPS.map((group) => (
        <Card key={group.title}>
          <CardHeader>
            <CardTitle>{group.title}</CardTitle>
            <CardDescription>{group.description}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {group.toolIds.map((toolId) => (
              <ToolRow key={toolId} toolId={toolId} />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
