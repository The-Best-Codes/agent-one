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
import { ScrollArea } from "@/components/ui/scroll-area";
import { trackSettingsInteraction } from "@/lib/google-analytics";
import { activeSettingsSectionAtom } from "@/lib/jotai/unsynced-local-atoms";

import { isValidSection, sections } from "./sections-config";
import SettingsContent from "./settings-content";
import SettingsSidebar from "./settings-sidebar";

export default function SettingsRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useAtom(activeSettingsSectionAtom);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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

  const handleNavigateBack = () => {
    const chatId = searchParams.get("chatId");
    if (chatId) {
      void navigate(`/chat/${chatId}`);
    } else {
      void navigate("/chat");
    }
  };

  const contentRef = useRef<HTMLDivElement>(null);
  const previousSectionRef = useRef(displayedSection);

  useEffect(() => {
    const viewport = contentRef.current?.closest("[data-slot='scroll-area-viewport']");
    const sectionChanged = previousSectionRef.current !== displayedSection;

    previousSectionRef.current = displayedSection;

    if (location.hash) {
      const targetId = location.hash.slice(1);
      let frameId = 0;
      let attempts = 0;

      const scrollToHashTarget = () => {
        const target = document.getElementById(targetId);

        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "center" });
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

      return;
    }

    if (sectionChanged) {
      viewport?.scrollTo({ top: 0 });
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
    <main role="main" className="bg-background min-h-screen">
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

      <div className="mx-auto max-w-5xl p-4 md:flex md:h-screen md:flex-col md:p-6">
        <div className="flex flex-col gap-6 md:min-h-0 md:flex-1 md:flex-row">
          <ScrollArea type="always" className="hidden w-48 shrink-0 md:flex md:flex-col lg:w-64">
            <div className="flex flex-col gap-2">
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
          </ScrollArea>

          <ScrollArea type="always" className="-m-0.5 flex-1 md:min-h-0" viewportClassName="p-0.5">
            <div
              ref={contentRef}
              role="tabpanel"
              tabIndex={0}
              className="focus-visible:border-ring/50 focus-visible:border-[3px] focus-visible:outline-1"
            >
              <SettingsContent activeSection={displayedSection} />
            </div>
          </ScrollArea>
        </div>
      </div>
    </main>
  );
}
