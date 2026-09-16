import { IconExternalLink } from "@tabler/icons-react";

const helpLinks = [
  { label: "Report a bug", href: "https://github.com/AgentOne-Dev/agent-one-public/issues/new" },
  { label: "Get help on Discord", href: "https://www.agent-one.dev/discord" },
  { label: "Read the docs", href: "https://docs.agent-one.dev/docs" },
];

export default function HelpSettings() {
  return (
    <div className="flex flex-col gap-1">
      {helpLinks.map((link) => (
        <a
          key={link.href}
          target="_blank"
          rel="noopener noreferrer"
          href={link.href}
          className="flex w-fit items-center gap-1 underline"
        >
          {link.label}
          <IconExternalLink className="size-4" />
        </a>
      ))}
    </div>
  );
}
