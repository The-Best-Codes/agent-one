import { useState } from "react";

import { cn } from "@/lib/utils";

import { getExtensionHue } from "../model";

export function ExtensionIcon({
  name,
  src,
  className,
}: {
  name: string;
  src?: string;
  className?: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string>();
  const showImage = Boolean(src) && failedSrc !== src;
  const letter = (name.match(/[\p{L}\p{N}]/u)?.[0] ?? "?").toUpperCase();

  return (
    <div
      aria-hidden
      className={cn(
        "flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border text-base",
        showImage && "bg-white",
        className,
      )}
    >
      {showImage ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          draggable={false}
          className="size-full object-contain p-[12%]"
          onError={() => setFailedSrc(src)}
        />
      ) : (
        <span
          className="flex size-full items-center justify-center font-semibold text-white"
          style={{ backgroundColor: `oklch(0.52 0.11 ${getExtensionHue(name)})` }}
        >
          {letter}
        </span>
      )}
    </div>
  );
}
