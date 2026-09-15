import { Children, type ReactElement, type ReactNode } from "react";

export function selectSettingsCard(
  content: ReactElement<{ children?: ReactNode }>,
  cardIndex?: number,
): ReactNode {
  if (cardIndex === undefined) return content;

  const cards = Children.toArray(content.props.children as ReactNode);
  return cards[cardIndex] ?? null;
}
