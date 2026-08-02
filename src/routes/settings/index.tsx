import { IconArrowLeft, IconList } from "@tabler/icons-react";
import { useAtom } from "jotai";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { useOverflow } from "@/hooks/use-overflow";
import { trackSettingsInteraction } from "@/lib/google-analytics";
import { activeSettingsSectionAtom } from "@/lib/jotai/unsynced-local-atoms";
import { cn } from "@/lib/utils";

import { isValidSection, sections } from "./sections-config";
import SettingsContent from "./settings-content";
import SettingsSidebar from "./settings-sidebar";

export default function SettingsRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useAtom(activeSettingsSectionAtom);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const rootRef = useRef<HTMLElement>(null);

  const tabParam = searchParams.get("tab");
  const displayedSection = useMemo(() => {
    try {
      if (tabParam && isValidSection(tabParam)) {
        return tabParam;
      }
      if (isValidSection(activeSection)) {
        return activeSection;
      }
      return sections[0].id;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      return sections[0].id;
    }
  }, [tabParam, activeSection]);

  const fillHeight = useMemo(
    () => sections.find((section) => section.id === displayedSection)?.fillHeight === true,
    [displayedSection],
  );

  const handleNavigateBack = () => {
    const chatId = searchParams.get("chatId");
    if (chatId) {
      void navigate(`/chat/${chatId}`);
    } else {
      void navigate("/chat");
    }
  };

  const sidebarRef = useRef<HTMLDivElement>(null);
  const isSidebarOverflowing = useOverflow(sidebarRef);
  const previousSectionRef = useRef(displayedSection);

  useEffect(() => {
    const sectionChanged = previousSectionRef.current !== displayedSection;

    previousSectionRef.current = displayedSection;

    if (location.hash) {
      const targetId = location.hash.slice(1);
      let frameId = 0;
      let attempts = 0;

      const scrollToHashTarget = () => {
        const target = document.getElementById(targetId);

        if (target) {
          target.scrollIntoView({
            behavior: "smooth",
            block: target.getBoundingClientRect().height > window.innerHeight ? "start" : "center",
          });
          return;
        }

        if (attempts < 10) {
          attempts += 1;
          frameId = window.requestAnimationFrame(scrollToHashTarget);
        }
      };

      frameId = window.requestAnimationFrame(scrollToHashTarget);

      return () => {
        window.cancelAnimationFrame(frameId);
      };
    }

    if (sectionChanged) {
      rootRef.current?.scrollIntoView({ block: "start" });
      window.requestAnimationFrame(() => {
        rootRef.current?.scrollIntoView({ block: "start" });
      });
    }
  }, [displayedSection, location.hash]);

  const handleSectionChange = (section: string) => {
    trackSettingsInteraction("navigation", "section_changed", { value: section });
    setActiveSection(section);
    if (tabParam) {
      setSearchParams((prev) => {
        prev.delete("tab");
        return prev;
      });
    }
  };

  return (
    <main
      ref={rootRef}
      role="main"
      className={cn(
        "bg-background min-h-svh pl-[calc(100vw-100%)]",
        fillHeight && "flex h-svh min-h-0 flex-col overflow-hidden",
      )}
    >
      <h1 className="sr-only">Settings</h1>
      <div className="bg-background sticky top-0 z-10 border-b p-4 md:hidden">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={handleNavigateBack}
            analytics={{ event: "settings_back_clicked", params: { ui_location: "mobile_header" } }}
          >
            <IconArrowLeft data-icon="inline-start" />
            Back
          </Button>
          <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
            <DrawerTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                aria-label="Open settings menu"
                analytics={{
                  event: "settings_menu_opened",
                  params: { ui_location: "mobile_header" },
                }}
              >
                <IconList />
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle className="mb-2">Settings</DrawerTitle>
                <DrawerDescription className="sr-only">List of setting sections</DrawerDescription>
                <SettingsSidebar
                  activeSection={displayedSection}
                  onSectionChange={(section) => {
                    handleSectionChange(section);
                    setIsDrawerOpen(false);
                  }}
                />
              </DrawerHeader>
            </DrawerContent>
          </Drawer>
        </div>
      </div>

      <div
        className={cn(
          "mx-auto w-full max-w-5xl p-4 md:flex md:flex-col md:p-6",
          fillHeight && "flex min-h-0 flex-1 flex-col md:h-full md:min-h-0",
        )}
      >
        <div className={cn("flex flex-col gap-6 md:flex-row", fillHeight && "min-h-0 flex-1")}>
          <div
            ref={sidebarRef}
            className={cn(
              "hidden w-48 shrink-0 md:flex md:flex-col lg:w-64",
              fillHeight ? "overflow-auto" : "md:sticky md:top-6 md:self-start",
              fillHeight && isSidebarOverflowing && "pr-2",
            )}
          >
            <div className="flex flex-col gap-2 pl-0.5">
              <div className="mb-2">
                <Button
                  variant="outline"
                  onClick={handleNavigateBack}
                  className="w-full"
                  analytics={{
                    event: "settings_back_clicked",
                    params: { ui_location: "desktop_sidebar" },
                  }}
                >
                  <IconArrowLeft data-icon="inline-start" />
                  Back to Chat
                </Button>
              </div>
              <SettingsSidebar
                activeSection={displayedSection}
                onSectionChange={handleSectionChange}
              />
            </div>
          </div>

          {fillHeight ? (
            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              <div
                role="tabpanel"
                tabIndex={0}
                className={cn(
                  "focus-visible:border-ring/50 focus-visible:border-[3px] focus-visible:outline-1",
                  "flex min-h-0 min-w-0 flex-1 flex-col",
                )}
              >
                <SettingsContent activeSection={displayedSection} fillHeight />
              </div>
            </div>
          ) : (
            <div className="min-w-0 flex-1">
              <div
                role="tabpanel"
                tabIndex={0}
                className="focus-visible:border-ring/50 focus-visible:border-[3px] focus-visible:outline-1"
              >
                <SettingsContent activeSection={displayedSection} />
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
