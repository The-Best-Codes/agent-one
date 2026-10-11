import { useLocation, useMatch } from "react-router";

export interface SettingsDestination {
  id?: string;
}

export function useSettingsPath({ id }: SettingsDestination = {}) {
  const location = useLocation();
  const chatMatch = useMatch("/chat/:id");
  const chatId = chatMatch?.params.id ?? new URLSearchParams(location.search).get("chatId");

  return `/settings${chatId ? `?${new URLSearchParams({ chatId })}` : ""}${id ? `#${id}` : ""}`;
}
