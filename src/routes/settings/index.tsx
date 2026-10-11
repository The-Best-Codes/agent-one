import { IconArrowLeft, IconList } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

import SettingsNav from "./settings-nav";
import { SettingsSections } from "./settings-renderer";
import { SETTINGS_TOC } from "./settings-schema";
import { SettingsSearch, SettingsSearchTrigger } from "./settings-search";

function scrollToElement(id: string, behavior: ScrollBehavior = "smooth") {
  const target = document.getElementById(id);

  target?.scrollIntoView({
    behavior,
    block: target.getBoundingClientRect().height > window.innerHeight ? "start" : "center",
  });

  return Boolean(target);
}

function useActiveItems() {
  const [activeIds, setActiveIds] = useState<string[]>([]);

  useEffect(() => {
    const updateActiveItems = () => {
      const rects = SETTINGS_TOC.map((item) => {
        const rect = document.getElementById(item.id)?.getBoundingClientRect();
        return rect && rect.height > 0 ? rect : null;
      });

      const ids = SETTINGS_TOC.filter((item, index) => {
        const rect = rects[index];
        if (!rect) return false;

        const nextIndex = rects.findIndex((other, otherIndex) => otherIndex > index && other);
        const nextItem = SETTINGS_TOC[nextIndex];
        const bottom =
          nextItem && nextItem.depth > item.depth
            ? Math.min(rect.bottom, rects[nextIndex]?.top ?? rect.bottom)
            : rect.bottom;

        return bottom > 0 && rect.top < window.innerHeight;
      }).map((item) => item.id);

      setActiveIds((previous) =>
        previous.length === ids.length && previous.every((id, index) => id === ids[index])
          ? previous
          : ids,
      );
    };

    const observer = new ResizeObserver(updateActiveItems);
    observer.observe(document.body);
    updateActiveItems();
    window.addEventListener("scroll", updateActiveItems, { passive: true });
    window.addEventListener("resize", updateActiveItems);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", updateActiveItems);
      window.removeEventListener("resize", updateActiveItems);
    };
  }, []);

  return activeIds;
}

export default function SettingsRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const activeIds = useActiveItems();
  const legacyTab = searchParams.get("tab");

  useEffect(() => {
    const targetId = location.hash ? location.hash.slice(1) : legacyTab && `section-${legacyTab}`;
    if (!targetId) return;

    let attempts = 0;
    let frameId = window.requestAnimationFrame(function scrollToTarget() {
      if (!scrollToElement(targetId) && attempts++ < 10) {
        frameId = window.requestAnimationFrame(scrollToTarget);
      }
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [location.hash, location.key, legacyTab]);

  const handleNavigateBack = () => {
    const chatId = searchParams.get("chatId");
    void navigate(chatId ? `/chat/${chatId}` : "/chat");
  };

  const handleNavigate = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSearchSelect = (id: string) => {
    void navigate({ search: location.search, hash: id }, { replace: true });
  };

  return (
    <main role="main" className="bg-background min-h-svh pl-[calc(100vw-100%)]">
      <h1 className="sr-only">Settings</h1>
      <SettingsSearch
        open={isSearchOpen}
        onOpenChange={setIsSearchOpen}
        onSelect={handleSearchSelect}
      />
      <div className="bg-background sticky top-0 z-10 border-b p-4 md:hidden">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleNavigateBack}>
            <IconArrowLeft data-icon="inline-start" />
            Back
          </Button>
          <div className="min-w-0 flex-1">
            <SettingsSearchTrigger onClick={() => setIsSearchOpen(true)} />
          </div>
          <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
            <DrawerTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Open settings menu">
                <IconList />
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Setting Categories</DrawerTitle>
                <DrawerDescription className="sr-only">List of setting sections</DrawerDescription>
                <SettingsNav
                  className="mt-1 max-h-[60svh]"
                  activeIds={activeIds}
                  onNavigate={(id) => {
                    setIsDrawerOpen(false);
                    handleNavigate(id);
                  }}
                />
              </DrawerHeader>
            </DrawerContent>
          </Drawer>
        </div>
      </div>

      <div className="mx-auto w-full max-w-5xl p-4 md:p-6">
        <div className="flex flex-col gap-6 md:flex-row">
          <div className="hidden w-48 shrink-0 md:sticky md:top-6 md:flex md:max-h-[calc(100svh-3rem)] md:flex-col md:gap-3 md:self-start lg:w-64">
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                onClick={handleNavigateBack}
                className="w-full justify-start"
              >
                <IconArrowLeft data-icon="inline-start" />
                Back to Chat
              </Button>
              <SettingsSearchTrigger onClick={() => setIsSearchOpen(true)} />
            </div>
            <SettingsNav activeIds={activeIds} onNavigate={handleNavigate} />
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-12">
            <SettingsSections />
          </div>
        </div>
      </div>
    </main>
  );
}
