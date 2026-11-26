import { useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";

const visitedPaths: string[] = [];

const getHistoryIndex = () => (window.history.state as { idx?: number } | null)?.idx ?? 0;

export function useTrackHistory() {
  const { pathname, key } = useLocation();
  useEffect(() => {
    visitedPaths[getHistoryIndex()] = pathname;
  }, [pathname, key]);
}

export function useBack() {
  const navigate = useNavigate();
  return useCallback(
    (fallback = "/chat") => {
      if (getHistoryIndex() > 0) {
        void navigate(-1);
      } else {
        void navigate(fallback, { replace: true });
      }
    },
    [navigate],
  );
}

export function useUp() {
  const navigate = useNavigate();
  return useCallback(
    (path: string) => {
      const idx = getHistoryIndex();
      if (idx > 0 && visitedPaths[idx - 1] === path) {
        void navigate(-1);
      } else {
        void navigate(path, { replace: true });
      }
    },
    [navigate],
  );
}
