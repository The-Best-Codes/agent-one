import { useAtom } from "jotai";
import { ArrowLeftIcon, SettingsIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

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
import { activeSettingsSectionAtom } from "@/lib/jotai/atoms";

import { isValidSection, sections } from "./sections-config";
import SettingsContent from "./settings-content";
import SettingsSidebar from "./settings-sidebar";

export default function SettingsRoute() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
      navigate(`/chat/${chatId}`);
    } else {
      navigate("/chat");
    }
  };

  return (
    <main role="main" className="bg-background min-h-screen">
      <h1 className="sr-only">Settings</h1>
      <div className="bg-background sticky top-0 z-10 border-b p-4 md:hidden">
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={handleNavigateBack}>
            <ArrowLeftIcon className="size-4" />
            Back
          </Button>
          <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
            <DrawerTrigger asChild>
              <Button variant="outline" size="icon">
                <SettingsIcon className="size-4" />
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle className="mb-2">Settings</DrawerTitle>
                <DrawerDescription className="sr-only">
                  List of setting sections
                </DrawerDescription>
                <SettingsSidebar
                  activeSection={displayedSection}
                  onSectionChange={(section) => {
                    setActiveSection(section);
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
          <ScrollArea
            type="always"
            className="hidden w-64 shrink-0 md:flex md:flex-col"
          >
            <div className="flex flex-col gap-2">
              <div className="mb-2">
                <Button
                  variant="outline"
                  onClick={handleNavigateBack}
                  className="w-full"
                >
                  <ArrowLeftIcon className="size-4" />
                  Back to Chat
                </Button>
              </div>
              <SettingsSidebar
                activeSection={displayedSection}
                onSectionChange={setActiveSection}
              />
            </div>
          </ScrollArea>

          <ScrollArea type="always" className="flex-1 md:min-h-0">
            <div role="tabpanel" tabIndex={0}>
              <SettingsContent activeSection={displayedSection} />
            </div>
          </ScrollArea>
        </div>
      </div>
    </main>
  );
}
