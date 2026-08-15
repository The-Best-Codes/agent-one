import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

const SPINNER_SEGMENTS = Array.from({ length: 12 }, (_, index) => ({
  angle: index * 30,
  delay: `${(index - 11) * 100}ms`,
}));

const SPINNER_KEYFRAMES = `
  @keyframes spinner-line-fade {
    0% {
      opacity: 1;
    }

    to {
      opacity: 0.15;
    }
  }
`;

function Spinner({ className, ...props }: React.ComponentProps<"div">) {
  const { t } = useTranslation();

  return (
    <div
      role="status"
      aria-label={t("common.loading")}
      data-geist-spinner=""
      data-version="v1"
      data-slot="spinner"
      className={cn(
        "text-muted-foreground relative inline-block size-4 shrink-0 align-middle",
        className,
      )}
      {...props}
    >
      <style>{SPINNER_KEYFRAMES}</style>
      <div className="absolute top-1/2 left-1/2 size-full">
        {SPINNER_SEGMENTS.map(({ angle, delay }) => (
          <div
            key={angle}
            className="absolute top-[-3.9%] left-[-10%] h-[8%] w-[24%] rounded-xs"
            style={{
              animation: "spinner-line-fade var(--animation-duration,1.2s) linear infinite",
              animationDelay: `var(--animation-delay, ${delay})`,
              transform: `rotate(${angle}deg) translate(146%)`,
              background: "var(--spinner-color, currentColor)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

export { Spinner };
