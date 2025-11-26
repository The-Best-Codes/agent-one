import { useAtom } from "jotai";
import { ArrowLeftIcon, SettingsIcon } from "lucide-react";
import { useState } from "react";
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
import { activeSettingsSectionAtom } from "@/lib/jotai/atoms";

import SettingsContent from "./settings-content";
import SettingsSidebar from "./settings-sidebar";

export default function SettingsRoute() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useAtom(activeSettingsSectionAtom);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleNavigateBack = () => {
    const chatId = searchParams.get("chatId");
    if (chatId) {
      navigate(`/chat/${chatId}`);
    } else {
      navigate("/chat");
    }
  };

  return (
    <div className="bg-background min-h-screen">
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
                  activeSection={activeSection}
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
          <div className="hidden w-64 shrink-0 md:flex md:flex-col md:overflow-y-auto">
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
              activeSection={activeSection}
              onSectionChange={setActiveSection}
            />
          </div>

          <div className="flex-1 md:min-h-0 md:overflow-y-auto">
            <SettingsContent activeSection={activeSection} />
          </div>
        </div>
      </div>
    </div>
  );
}
