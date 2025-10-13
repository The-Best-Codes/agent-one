import { ArrowLeftIcon, MenuIcon } from "lucide-react";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTrigger,
} from "@/components/ui/drawer";

import SettingsContent from "./settings-content";
import SettingsSidebar from "./settings-sidebar";

export default function SettingsRoute() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState("appearance");
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
        <Button
          variant="outline"
          size="sm"
          onClick={handleNavigateBack}
          className="w-full"
        >
          <ArrowLeftIcon className="size-4" />
          Back to Chat
        </Button>
      </div>

      <div className="container mx-auto p-6">
        <div className="flex flex-col gap-6 md:flex-row">
          <div className="hidden w-64 flex-shrink-0 md:block">
            <div className="sticky top-6">
              <div className="mb-4">
                <Button
                  variant="outline"
                  size="sm"
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
          </div>

          <div className="md:hidden">
            <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
              <DrawerTrigger asChild>
                <Button variant="outline" size="sm" className="mb-4 w-full">
                  <MenuIcon className="size-4" />
                  Settings Menu
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
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

          <div className="flex-1">
            <SettingsContent activeSection={activeSection} />
          </div>
        </div>
      </div>
    </div>
  );
}
