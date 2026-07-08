import { IconBuilding } from "@tabler/icons-react";
import { useEffect, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const getProviderLogoUrl = (providerId: string) =>
  `https://raw.githubusercontent.com/The-Best-Codes/ai-model-directory/refs/heads/main/data/providers/${providerId}/logo-raw.svg`;

const parseSvgColors = (svgText: string) => {
  const doc = new DOMParser().parseFromString(svgText, "image/svg+xml");
  const colorValues = Array.from(doc.querySelectorAll("*"))
    .flatMap((element) => [
      element.getAttribute("fill"),
      element.getAttribute("stroke"),
      ...Array.from(
        element.getAttribute("style")?.matchAll(/(?:fill|stroke):\s*([^;]+)/gi) ?? [],
        (match) => match[1],
      ),
    ])
    .filter((color): color is string => Boolean(color))
    .map((color) => color.trim().toLowerCase())
    .filter(
      (color) => color && color !== "none" && color !== "transparent" && color !== "currentcolor",
    );

  return colorValues;
};

const getColorLuminance = (color: string) => {
  const hex = color.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)?.[1];
  const rgb = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i);

  if (color === "white") {
    return 1;
  }

  if (color === "black") {
    return 0;
  }

  const channels = hex
    ? hex.length === 3
      ? hex.split("").map((value) => Number.parseInt(value + value, 16))
      : [0, 2, 4].map((index) => Number.parseInt(hex.slice(index, index + 2), 16))
    : rgb?.slice(1, 4).map(Number);

  if (!channels || channels.length !== 3 || channels.some(Number.isNaN)) {
    return undefined;
  }

  const [red, green, blue] = channels.map((value) => value / 255);

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
};

const getLogoBackground = (svgText: string) => {
  const luminances = parseSvgColors(svgText)
    .map(getColorLuminance)
    .filter((luminance): luminance is number => luminance !== undefined);

  if (luminances.length === 0) {
    return "bg-white";
  }

  if (luminances.some((luminance) => luminance > 0.7)) {
    return "bg-neutral-950";
  }

  const averageLuminance =
    luminances.reduce((total, luminance) => total + luminance, 0) / luminances.length;

  return averageLuminance > 0.7 ? "bg-neutral-950" : "bg-white";
};

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
  const [logoBackground, setLogoBackground] = useState("bg-background");
  const logoUrl = getProviderLogoUrl(id);

  useEffect(() => {
    const controller = new AbortController();

    fetch(logoUrl, { signal: controller.signal })
      .then((response) => (response.ok ? response.text() : ""))
      .then((svgText) => {
        if (svgText) {
          setLogoBackground(getLogoBackground(svgText));
        }
      })
      .catch(() => {});

    return () => controller.abort();
  }, [logoUrl]);

  return (
    <Avatar size={size} className={cn(logoBackground, className, "rounded-full")}>
      <AvatarImage
        src={logoUrl}
        alt=""
        className={cn("object-contain p-1 rounded-none", imageClassName)}
      />
      <AvatarFallback aria-label={title}>
        <IconBuilding className="size-4" />
      </AvatarFallback>
    </Avatar>
  );
}
