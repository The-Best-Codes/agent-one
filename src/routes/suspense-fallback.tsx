export default function SuspenseFallback() {
  return (
    <main
      className="flex h-svh flex-col items-center justify-center"
      role="main"
      data-testid="main"
    >
      <img src="/icon-dark-wide-padding.svg" alt="AgentOne" className="size-48" />
      <span className="text-gradient-shimmer from-foreground via-muted-foreground to-foreground bg-linear-to-r p-4 text-xl select-none">
        Almost there!
      </span>
    </main>
  );
}
