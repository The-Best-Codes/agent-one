export default function SuspenseFallback() {
  return (
    <main
      className="flex h-svh flex-col items-center justify-center"
      role="main"
      data-testid="main"
    >
      <img src="/icon-dark-wide-padding.svg" alt="AgentOne" className="size-48" />
      <div className="mt-2 h-1">
        {/* Placeholder to prevent layout shift after progress bar is hidden */}
      </div>
    </main>
  );
}
