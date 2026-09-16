import { IconRestore } from "@tabler/icons-react";
import { atom, useAtomValue } from "jotai";
import { createElement } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getGroupsForSection,
  getSettingDefinition,
  resolveSectionId,
  type SettingGroupDefinition,
} from "@/lib/settings/registry";
import { resetSetting } from "@/lib/settings/reset-settings";
import { DEFAULT_SETTINGS } from "@/lib/settings/types";
import { cn } from "@/lib/utils";

import { getCustomSettingComponent } from "./custom-components";
import SettingField from "./setting-field";
import SettingsTarget from "./settings-target";

const EMPTY_ATOM = atom<undefined>(undefined);

interface SettingsContentProps {
  activeSection: string;
  fillHeight?: boolean;
}

function GroupResetButton({ group }: { group: SettingGroupDefinition }) {
  const owner = (group.settings ?? []).find(
    (setting) => setting.key === group.resetKey && !setting.path,
  );
  const value = useAtomValue(owner?.atom ?? EMPTY_ATOM);
  const isDefault =
    JSON.stringify(value) ===
    JSON.stringify(group.resetKey ? DEFAULT_SETTINGS[group.resetKey] : value);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => {
        if (group.resetKey) resetSetting(group.resetKey);
      }}
      disabled={isDefault}
      aria-label={`Reset ${group.title} to default`}
    >
      <IconRestore data-icon="inline-start" />
    </Button>
  );
}

function SettingGroup({ group }: { group: SettingGroupDefinition }) {
  const settings = (group.settings ?? []).flatMap((definition) => {
    const resolved = getSettingDefinition(definition.id);
    return resolved ? [resolved] : [];
  });

  if (group.frameless) {
    if (!group.componentId) return null;

    const content = createElement(getCustomSettingComponent(group.componentId), { group });
    return group.anchor ? (
      <SettingsTarget id={`setting-${group.anchor}`}>{content}</SettingsTarget>
    ) : (
      content
    );
  }

  const card = (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>{group.title}</CardTitle>
          {group.resetKey && <GroupResetButton group={group} />}
        </div>
        {group.description && <CardDescription>{group.description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {group.componentId &&
          createElement(getCustomSettingComponent(group.componentId), { group })}
        {settings.map((setting) => (
          <SettingField key={setting.definition.id} setting={setting} />
        ))}
      </CardContent>
    </Card>
  );

  return group.anchor ? (
    <SettingsTarget id={`setting-${group.anchor}`}>{card}</SettingsTarget>
  ) : (
    card
  );
}

export default function SettingsContent({ activeSection, fillHeight }: SettingsContentProps) {
  const sectionId = resolveSectionId(activeSection);

  if (!sectionId) {
    return <div>Select a section from the sidebar.</div>;
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-6",
        fillHeight && "min-h-0 min-w-0 flex-1",
        sectionId === "extensions" && "gap-0",
      )}
    >
      {getGroupsForSection(sectionId).map((group) => (
        <SettingGroup key={group.id} group={group} />
      ))}
    </div>
  );
}
