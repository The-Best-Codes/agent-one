import { useEffect } from "react";
import { useNavigate } from "react-router";

import SuspenseFallback from "./suspense-fallback";

export default function NotFoundRoute() {
  const navigate = useNavigate();

  useEffect(() => {
    void navigate("/");
  });

  return <SuspenseFallback />;
}
