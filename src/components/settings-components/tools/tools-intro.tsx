import { IconBulb } from "@tabler/icons-react";
import { Link } from "react-router";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function ToolsIntro() {
  return (
    <Alert>
      <IconBulb />
      <AlertTitle>Add more tools</AlertTitle>
      <AlertDescription>
        Browse <Link to="/extensions">Extensions</Link> to add more tools and capabilities.
      </AlertDescription>
    </Alert>
  );
}
