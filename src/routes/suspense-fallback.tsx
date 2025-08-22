export default function SuspenseFallback() {
  return (
    <main
      className="h-screen flex flex-col items-center justify-center"
      role="main"
      data-testid="main"
    >
      <span className="text-shimmer text-5xl p-4 bg-gradient-to-r from-foreground via-muted-foreground to-foreground">
        AgentOne
      </span>
    </main>
  );
}
