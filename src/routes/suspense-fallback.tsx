/*
  When @/index.html's loader is updated, this should be updated as well!
*/

export default function SuspenseFallback() {
  return (
    <main
      className="flex h-svh flex-col items-center justify-center"
      role="main"
      data-testid="main"
    >
      <span className="text-shimmer from-foreground via-muted-foreground to-foreground bg-gradient-to-r p-4 text-5xl">
        AgentOne
      </span>
    </main>
  );
}
