import { atom, useAtomValue } from "jotai";

import {
  ResetButton,
  SettingControl,
  SettingsRow,
  type SettingsLayout,
  SliderLabel,
} from "@/components/settings-components/setting-controls";
import { SettingsTarget } from "@/components/settings-components/settings-target";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SETTINGS, type SettingDefinition } from "@/lib/settings/definitions";
import { cn } from "@/lib/utils";

import {
  getCardAnchorId,
  type SettingsCard,
  type SettingsItem,
  SETTINGS_SECTIONS,
} from "./settings-schema";

const alwaysAtom = atom(true);

const DEFAULT_LAYOUTS: Record<SettingDefinition["control"], SettingsLayout> = {
  switch: "row",
  select: "responsive",
  number: "responsive",
  slider: "slider",
  text: "stacked",
  data: "responsive",
};

function SettingsItemView({ item }: { item: SettingsItem }) {
  const visible = useAtomValue(item.visible ?? alwaysAtom);

  if (!visible) return null;

  if (item.render) {
    return (
      <SettingsTarget id={`setting-${item.id}`}>
        <item.render />
      </SettingsTarget>
    );
  }

  const definition = item.key ? SETTINGS[item.key] : undefined;
  const layout = item.layout ?? (definition ? DEFAULT_LAYOUTS[definition.control] : "responsive");
  const controlId = `${item.id}-control`;

  return (
    <SettingsTarget id={`setting-${item.id}`}>
      <SettingsRow
        label={
          item.key && definition?.control === "slider" ? (
            <SliderLabel settingKey={item.key} />
          ) : (
            (item.label ?? definition?.label)
          )
        }
        description={item.description ?? definition?.description}
        htmlFor={item.control ? undefined : controlId}
        layout={layout}
        action={item.key && layout !== "stacked" ? <ResetButton settingKey={item.key} /> : null}
      >
        {item.control ? (
          <item.control />
        ) : (
          item.key && (
            <SettingControl settingKey={item.key} id={controlId} disabledAtom={item.disabled} />
          )
        )}
      </SettingsRow>
    </SettingsTarget>
  );
}

function SettingsCardView({ card, anchorId }: { card: SettingsCard; anchorId: string }) {
  const visible = useAtomValue(card.visible ?? alwaysAtom);

  if (!visible) return null;

  const content = (
    <Card size={card.size}>
      {card.title && (
        <CardHeader>
          <CardTitle>{card.title}</CardTitle>
          {card.description && <CardDescription>{card.description}</CardDescription>}
          {card.resetKey && (
            <CardAction>
              <ResetButton settingKey={card.resetKey} />
            </CardAction>
          )}
        </CardHeader>
      )}
      <CardContent className={cn("flex flex-col", card.render ? "gap-4" : "gap-6")}>
        {card.render ? (
          <card.render />
        ) : (
          card.items?.map((item) => <SettingsItemView key={item.id} item={item} />)
        )}
      </CardContent>
    </Card>
  );

  return card.id || card.title ? <SettingsTarget id={anchorId}>{content}</SettingsTarget> : content;
}

export function SettingsSectionCards({ sectionId }: { sectionId: string }) {
  return SETTINGS_SECTIONS.find((section) => section.id === sectionId)?.cards.map((card, index) => (
    <SettingsCardView key={index} card={card} anchorId={getCardAnchorId(sectionId, card, index)} />
  ));
}

export function SettingsSections() {
  return SETTINGS_SECTIONS.map((section) => (
    <section
      key={section.id}
      id={`section-${section.id}`}
      aria-labelledby={`section-${section.id}-heading`}
      className="flex scroll-mt-20 flex-col gap-6 md:scroll-mt-6"
    >
      <h2 id={`section-${section.id}-heading`} className="text-xl font-semibold">
        {section.label}
      </h2>
      {section.intro && <section.intro />}
      {section.cards.map((card, index) => (
        <SettingsCardView
          key={index}
          card={card}
          anchorId={getCardAnchorId(section.id, card, index)}
        />
      ))}
    </section>
  ));
}
