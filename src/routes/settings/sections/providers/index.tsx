import { IconInfoCircle } from "@tabler/icons-react";
import { useAtomValue } from "jotai";

import { SettingsLink } from "@/components/a1/settings-link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { modelDirectoryStatusAtom } from "@/lib/ai/models/model-directory";

export function ProvidersIntro() {
  const { hasDownloadedList, isStartupComplete } = useAtomValue(modelDirectoryStatusAtom);

  if (!isStartupComplete || hasDownloadedList) return null;

  return (
    <Alert>
      <IconInfoCircle />
      <AlertTitle>Model list missing</AlertTitle>
      <AlertDescription>
        Built-in provider models won&apos;t appear in the model selector until the model list is
        downloaded.{" "}
        <SettingsLink id="setting-model-directory">Download the model list</SettingsLink>.
      </AlertDescription>
    </Alert>
  );
}
