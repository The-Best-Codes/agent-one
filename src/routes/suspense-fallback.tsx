export default function SuspenseFallback() {
  return (
    <main
      className="flex h-svh flex-col items-center justify-center"
      role="main"
      data-testid="main"
    >
      <img src="/icon-dark-raw.svg" alt="AgentOne" className="size-48 dark:invert" />
      <div className="mt-6 h-1">
        {/* Placeholder to prevent layout shift after progress bar is hidden */}
      </div>
    </main>
  );
}
