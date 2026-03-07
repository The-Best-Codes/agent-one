import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiKeys } from "@/contexts/use-api-keys/api-keys-hooks";

import { ProvidersList } from "./providers-list";

export default function ProvidersSection() {
  const { isApiKeysLoading } = useApiKeys();

  if (isApiKeysLoading) {
    return (
      <Card>
        <CardHeader>
          <h2 className="leading-none font-semibold">Provider Connections</h2>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="leading-none font-semibold">Provider Connections</h2>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-muted-foreground text-sm">
          Configure AI providers and their API keys. Enable or disable providers to control which
          models appear in the model selector.
        </p>

        <ProvidersList />
      </CardContent>
    </Card>
  );
}
