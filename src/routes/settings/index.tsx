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
import { SETTINGS_SECTIONS } from "./settings-schema";
import { SettingsSearch } from "./settings-search";

function scrollToElement(id: string, behavior: ScrollBehavior = "smooth") {
  const target = document.getElementById(id);

  target?.scrollIntoView({
    behavior,
    block: target.getBoundingClientRect().height > window.innerHeight ? "start" : "center",
  });

  return Boolean(target);
}

function useActiveSection() {
  const [activeSection, setActiveSection] = useState(SETTINGS_SECTIONS[0].id);

  useEffect(() => {
    const updateActiveSection = () => {
      const isAtBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      const visibleSection = SETTINGS_SECTIONS.filter(
        (section) =>
          (document.getElementById(`section-${section.id}`)?.getBoundingClientRect().top ??
            Infinity) <=
          window.innerHeight / 2,
      ).at(-1);

      setActiveSection(
        (isAtBottom ? SETTINGS_SECTIONS.at(-1) : visibleSection)?.id ?? SETTINGS_SECTIONS[0].id,
      );
    };

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    return () => window.removeEventListener("scroll", updateActiveSection);
  }, []);

  return activeSection;
}

export default function SettingsRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const activeSection = useActiveSection();
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

  const handleSectionChange = (section: string) => {
    document.getElementById(`section-${section}`)?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSearchSelect = (id: string) => {
    void navigate({ search: location.search, hash: `setting-${id}` }, { replace: true });
  };

  return (
    <main role="main" className="bg-background min-h-svh pl-[calc(100vw-100%)]">
      <h1 className="sr-only">Settings</h1>
      <div className="bg-background sticky top-0 z-10 border-b p-4 md:hidden">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleNavigateBack}>
            <IconArrowLeft data-icon="inline-start" />
            Back
          </Button>
          <div className="min-w-0 flex-1">
            <SettingsSearch onSelect={handleSearchSelect} />
          </div>
          <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
            <DrawerTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Open settings menu">
                <IconList />
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle className="mb-2">Setting Categories</DrawerTitle>
                <DrawerDescription className="sr-only">List of setting sections</DrawerDescription>
                <SettingsNav
                  activeSection={activeSection}
                  onSectionChange={(section) => {
                    setIsDrawerOpen(false);
                    handleSectionChange(section);
                  }}
                />
              </DrawerHeader>
            </DrawerContent>
          </Drawer>
        </div>
      </div>

      <div className="mx-auto w-full max-w-5xl p-4 md:p-6">
        <div className="flex flex-col gap-6 md:flex-row">
          <div className="hidden w-48 shrink-0 md:sticky md:top-6 md:flex md:flex-col md:gap-2 md:self-start md:pl-0.5 lg:w-64">
            <Button variant="outline" onClick={handleNavigateBack} className="mb-2 w-full">
              <IconArrowLeft data-icon="inline-start" />
              Back to Chat
            </Button>
            <SettingsSearch onSelect={handleSearchSelect} />
            <SettingsNav activeSection={activeSection} onSectionChange={handleSectionChange} />
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-12">
            <SettingsSections />
          </div>
        </div>
      </div>
    </main>
  );
}
