import { useEffect, useState } from "react";

interface UrlIframePreviewProps {
  url: string;
  className?: string;
  innerClassName?: string;
  iframeClassName?: string;
  siteWidth?: number;
  siteHeight?: number;
  containerWidth?: number;
  containerHeight?: number;
  isInteractive?: boolean;
}

export function UrlIframePreview({
  url,
  className,
  innerClassName,
  iframeClassName,
  siteWidth = 1920,
  siteHeight = 1080,
  containerWidth,
  containerHeight,
  isInteractive = false,
}: UrlIframePreviewProps) {
  const [error, setError] = useState(false);

  useEffect(() => {
    // Reset error state on new URLs
    setError(false);

    const abortController = new AbortController();
    const signal = abortController.signal;

    const checkUrlAvailability = async () => {
      try {
        const response = await fetch(url, { method: "HEAD", signal });
        if (!response.ok) {
          setError(true);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        setError(true);
      }
    };

    checkUrlAvailability();

    return () => {
      abortController.abort();
    };
  }, [url]);

  if (!containerWidth && !containerHeight) {
    throw new Error(
      "UrlIframePreview: Either containerWidth or containerHeight must be provided.",
    );
  }

  if (
    siteWidth <= 0 ||
    siteHeight <= 0 ||
    (containerWidth && containerWidth <= 0) ||
    (containerHeight && containerHeight <= 0)
  ) {
    throw new Error(
      "UrlIframePreview: siteWidth, siteHeight, containerWidth, and containerHeight must be positive numbers.",
    );
  }

  let scale: number;

  if (containerWidth && siteWidth) {
    scale = containerWidth / siteWidth;
  } else if (containerHeight && siteHeight) {
    scale = containerHeight / siteHeight;
  } else {
    throw new Error(
      "UrlIframePreview: Cannot calculate iframe scale. Either (containerWidth and siteWidth) or (containerHeight and siteHeight) must be provided.",
    );
  }

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: containerWidth || undefined,
        height: containerHeight || undefined,
      }}
    >
      <div
        className={innerClassName}
        style={{
          width: 0,
          height: 0,
          transform: `scale(${scale})`,
          transformOrigin: "center",
        }}
      >
        {!error ? (
          <iframe
            src={url}
            className={iframeClassName}
            style={{
              width: siteWidth,
              height: siteHeight,
              border: "none",
              pointerEvents: isInteractive ? "auto" : "none",
            }}
            sandbox=""
          ></iframe>
        ) : (
          <div
            className="flex items-center justify-center"
            style={{
              width: siteWidth,
              height: siteHeight,
            }}
          >
            <p className="text-muted-foreground text-center text-7xl">
              No preview available
            </p>
          </div>
        )}
      </div>
      {!isInteractive && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 1,
            pointerEvents: "auto",
            cursor: "default",
          }}
        />
      )}
    </div>
  );
}
