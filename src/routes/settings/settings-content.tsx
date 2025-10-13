import AboutSection from "./sections/about";
import AppearanceSection from "./sections/appearance";
import EditorSection from "./sections/editor";
import MessagesSection from "./sections/messages";
import StreamingSection from "./sections/streaming";

interface SettingsContentProps {
  activeSection: string;
}

export default function SettingsContent({
  activeSection,
}: SettingsContentProps) {
  const renderSection = () => {
    switch (activeSection) {
      case "appearance":
        return <AppearanceSection />;
      case "editor":
        return <EditorSection />;
      case "messages":
        return <MessagesSection />;
      case "streaming":
        return <StreamingSection />;
      case "about":
        return <AboutSection />;
      default:
        return <div>Select a section from the sidebar.</div>;
    }
  };

  return <div className="space-y-2">{renderSection()}</div>;
}
