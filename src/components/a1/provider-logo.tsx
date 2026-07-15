import { IconBuilding } from "@tabler/icons-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const getProviderLogoUrl = (providerId: string) =>
  `https://raw.githubusercontent.com/The-Best-Codes/ai-model-directory/refs/heads/main/data/providers/${providerId}/logo-raw-bg.svg`;

interface ProviderLogoProps {
  id: string;
  title: string;
  className?: string;
  imageClassName?: string;
  size?: "default" | "sm" | "lg";
}

export function ProviderLogo({
  id,
  title,
  className,
  imageClassName,
  size = "sm",
}: ProviderLogoProps) {
  return (
    <Avatar size={size} className={cn(className, "rounded-full overflow-hidden")}>
      <AvatarImage
        src={getProviderLogoUrl(id)}
        alt=""
        className={cn("object-contain rounded-none", imageClassName)}
      />
      <AvatarFallback aria-label={title}>
        <IconBuilding className="size-4" />
      </AvatarFallback>
    </Avatar>
  );
}
