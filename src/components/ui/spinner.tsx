import { cn } from "@/lib/utils";

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <svg
      role="status"
      aria-label="Loading"
      data-slot="spinner"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      className={cn("inline-block size-4 shrink-0 mask-x-from-75% align-middle", className)}
      {...props}
    >
      <path
        className="animate-[spinner-wave_1s_linear_infinite]"
        d="M-16 12q4-10 8 0t8 0 8 0 8 0 8 0 8 0 8 0"
      />
    </svg>
  );
}

export { Spinner };
