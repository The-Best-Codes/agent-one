import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { ToolRow } from "./tool-row";
import { TOOL_GROUPS } from "./tools-metadata";

export default function ToolsSection() {
  return (
    <div className="flex flex-col gap-6">
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
