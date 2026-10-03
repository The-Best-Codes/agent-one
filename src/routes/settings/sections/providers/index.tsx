import { IconInfoCircle } from "@tabler/icons-react";
import { useAtomValue } from "jotai";

import { SettingsLink } from "@/components/a1/settings-link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { modelDirectoryStatusAtom } from "@/lib/ai/models/model-directory";

import { ProvidersList } from "./providers-list";

export default function ProvidersSection() {
  const { hasDownloadedList, isStartupComplete } = useAtomValue(modelDirectoryStatusAtom);

  return (
    <div className="flex flex-col gap-4">
      {isStartupComplete && !hasDownloadedList && (
        <Alert>
          <IconInfoCircle />
          <AlertTitle>Model list missing</AlertTitle>
          <AlertDescription>
            Built-in provider models won&apos;t appear in the model selector until the model list is
            downloaded.{" "}
            <SettingsLink tab="about" id="setting-model-directory">
              Download the model list
            </SettingsLink>
            .
          </AlertDescription>
        </Alert>
      )}
      <ProvidersList />
    </div>
  );
}
