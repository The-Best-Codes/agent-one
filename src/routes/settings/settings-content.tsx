import AboutSection from "./sections/about";
import AccountSection from "./sections/account";
import AppearanceSection from "./sections/appearance";
import EditorSection from "./sections/editor";
import McpSection from "./sections/mcp";
import MessagesSection from "./sections/messages";
import StreamingSection from "./sections/streaming";
import TitlesSection from "./sections/titles";
import ToolsSection from "./sections/tools";

interface SettingsContentProps {
  activeSection: string;
}

export default function SettingsContent({
  activeSection,
}: SettingsContentProps) {
  // TODO: Extract this logic to sections-config.ts to follow the DRY principle
  const renderSection = () => {
    switch (activeSection) {
      case "account":
        return <AccountSection />;
      case "appearance":
        return <AppearanceSection />;
      case "editor":
        return <EditorSection />;
      case "messages":
        return <MessagesSection />;
      case "titles":
        return <TitlesSection />;
      case "tools":
        return <ToolsSection />;
      case "mcp":
        return <McpSection />;
      case "streaming":
        return <StreamingSection />;
      case "about":
        return <AboutSection />;
      default:
        return <div>Select a section from the sidebar.</div>;
    }
  };

  return <div className="flex flex-col gap-2">{renderSection()}</div>;
}
