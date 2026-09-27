import { useLocation, useMatch } from "react-router";

import type { SectionId } from "@/routes/settings/sections-metadata";

export interface SettingsDestination {
  tab?: SectionId;
  id?: string;
}

export function useSettingsPath({ tab, id }: SettingsDestination = {}) {
  const location = useLocation();
  const chatMatch = useMatch("/chat/:id");
  const chatId = chatMatch?.params.id ?? new URLSearchParams(location.search).get("chatId");
  const search = new URLSearchParams();

  if (tab) search.set("tab", tab);
  if (chatId) search.set("chatId", chatId);

  return `/settings${search.size ? `?${search}` : ""}${id ? `#${id}` : ""}`;
}
