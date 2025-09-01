import { useEffect } from "react";
import { useNavigate } from "react-router";

import SuspenseFallback from "./suspense-fallback";

export default function IndexRoute() {
  const navigate = useNavigate();

  useEffect(() => {
    // Later, when there is stuff to load, this won't happen until things are loaded
    navigate("/chat");
  });

  return <SuspenseFallback />;
}
