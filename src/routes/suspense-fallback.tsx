/*
  When this file is updated, @/index.html's loader section should be updated as well!
*/

export default function SuspenseFallback() {
  return (
    <main
      className="flex h-svh flex-col items-center justify-center"
      role="main"
      data-testid="main"
    >
      <span className="text-gradient-shimmer from-foreground via-muted-foreground to-foreground bg-linear-to-r p-4 text-5xl select-none">
        AgentOne
      </span>
    </main>
  );
}
