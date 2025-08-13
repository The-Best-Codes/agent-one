import { useEffect } from "react";
import { useNavigate } from "react-router";

export default function IndexRoute() {
  const navigate = useNavigate();

  useEffect(() => {
    // Later, when there is stuff to load, this won't happen until things are loaded
    navigate("/chat");
  });

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
