"use client";

import {
  Menu,
  type CheckMenuItemOptions,
  type MenuItemOptions,
  type PredefinedMenuItemOptions,
  type SubmenuOptions,
} from "@tauri-apps/api/menu";
import { LogicalPosition } from "@tauri-apps/api/window";
import * as React from "react";

import { getLogger } from "@/lib/logger";

const logger = getLogger(import.meta.url);

type NativeMenuItem =
  | MenuItemOptions
  | CheckMenuItemOptions
  | PredefinedMenuItemOptions
  | SubmenuOptions;

interface ContextMenuProps {
  children?: React.ReactNode;
  onOpenChange?: (open: boolean) => void;
}

interface ContextMenuContextValue {
  open: (event: React.MouseEvent) => void;
}

const ContextMenuContext = React.createContext<ContextMenuContextValue | null>(null);

function getText(children: React.ReactNode): string {
  return React.Children.toArray(children)
    .map((child) => {
      if (typeof child === "string" || typeof child === "number") return String(child);
      if (!React.isValidElement<{ children?: React.ReactNode }>(child)) return "";
      if (child.type === ContextMenuShortcut) return "";
      return getText(child.props.children);
    })
    .join("")
    .trim();
}

function getShortcut(children: React.ReactNode): string | undefined {
  for (const child of React.Children.toArray(children)) {
    if (!React.isValidElement<{ children?: React.ReactNode }>(child)) continue;
    if (child.type === ContextMenuShortcut) return getText(child.props.children);
    const shortcut = getShortcut(child.props.children);
    if (shortcut) return shortcut;
  }
}

function getContent(children: React.ReactNode): React.ReactNode {
  for (const child of React.Children.toArray(children)) {
    if (!React.isValidElement<{ children?: React.ReactNode }>(child)) continue;
    if (child.type === ContextMenuContent) return child.props.children;
  }
  return null;
}

function toMenuItems(
  children: React.ReactNode,
  radioValue?: string,
  onRadioValueChange?: (value: string) => void,
): NativeMenuItem[] {
  const items: NativeMenuItem[] = [];

  for (const child of React.Children.toArray(children)) {
    if (!React.isValidElement<Record<string, unknown>>(child)) continue;

    const props = child.props;
    const childNodes = props.children as React.ReactNode;

    if (child.type === React.Fragment || child.type === ContextMenuGroup) {
      items.push(...toMenuItems(childNodes, radioValue));
      continue;
    }

    if (child.type === ContextMenuRadioGroup) {
      items.push(
        ...toMenuItems(
          childNodes,
          props.value as string | undefined,
          props.onValueChange as ((value: string) => void) | undefined,
        ),
      );
      continue;
    }

    if (child.type === ContextMenuSeparator) {
      items.push({ item: "Separator" });
      continue;
    }

    if (child.type === ContextMenuLabel) {
      items.push({ text: getText(childNodes), enabled: false });
      continue;
    }

    if (child.type === ContextMenuSub) {
      const subChildren = React.Children.toArray(childNodes);
      const trigger = subChildren.find(
        (node) => React.isValidElement(node) && node.type === ContextMenuSubTrigger,
      );
      const content = subChildren.find(
        (node) => React.isValidElement(node) && node.type === ContextMenuSubContent,
      );

      if (React.isValidElement<Record<string, unknown>>(trigger)) {
        items.push({
          text: getText(trigger.props.children as React.ReactNode),
          enabled: !(trigger.props.disabled as boolean | undefined),
          items: React.isValidElement<Record<string, unknown>>(content)
            ? toMenuItems(content.props.children as React.ReactNode)
            : [],
        });
      }
      continue;
    }

    if (child.type === ContextMenuItem) {
      const onSelect = props.onSelect as ((event: Event) => void) | undefined;
      const onClick = props.onClick as React.MouseEventHandler<HTMLDivElement> | undefined;
      items.push({
        id: props.id as string | undefined,
        text: (props.textValue as string | undefined) ?? getText(childNodes),
        enabled: !(props.disabled as boolean | undefined),
        accelerator: (props.accelerator as string | undefined) ?? getShortcut(childNodes),
        action: () => {
          onSelect?.(new Event("select"));
          onClick?.(new MouseEvent("click") as unknown as React.MouseEvent<HTMLDivElement>);
        },
      });
      continue;
    }

    if (child.type === ContextMenuCheckboxItem || child.type === ContextMenuRadioItem) {
      const value = props.value as string | undefined;
      const onCheckedChange = props.onCheckedChange as ((checked: boolean) => void) | undefined;
      const checked =
        child.type === ContextMenuRadioItem ? radioValue === value : Boolean(props.checked);

      items.push({
        id: props.id as string | undefined,
        text: (props.textValue as string | undefined) ?? getText(childNodes),
        enabled: !(props.disabled as boolean | undefined),
        checked,
        accelerator: (props.accelerator as string | undefined) ?? getShortcut(childNodes),
        action: () => {
          if (child.type === ContextMenuRadioItem && value) onRadioValueChange?.(value);
          else onCheckedChange?.(!checked);
          (props.onSelect as ((event: Event) => void) | undefined)?.(new Event("select"));
          (props.onClick as React.MouseEventHandler<HTMLDivElement> | undefined)?.(
            new MouseEvent("click") as unknown as React.MouseEvent<HTMLDivElement>,
          );
        },
      });
    }
  }

  return items;
}

function ContextMenu({ children, onOpenChange }: ContextMenuProps) {
  const content = getContent(children);

  const open = React.useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      onOpenChange?.(true);
      const position = new LogicalPosition(event.clientX, event.clientY);

      void Menu.new({ items: toMenuItems(content) })
        .then(async (menu) => {
          try {
            await menu.popup(position);
          } finally {
            await menu.close();
          }
        })
        .catch((error: unknown) => logger.error("Failed to open native context menu", error))
        .finally(() => onOpenChange?.(false));
    },
    [content, onOpenChange],
  );

  return <ContextMenuContext.Provider value={{ open }}>{children}</ContextMenuContext.Provider>;
}

interface ContextMenuTriggerProps extends React.HTMLAttributes<HTMLElement> {
  asChild?: boolean;
}

function ContextMenuTrigger({
  asChild,
  children,
  onContextMenu,
  ...props
}: ContextMenuTriggerProps) {
  const context = React.useContext(ContextMenuContext);
  if (!context) throw new Error("ContextMenuTrigger must be used within a ContextMenu");

  const handleContextMenu = (event: React.MouseEvent<HTMLElement>) => {
    onContextMenu?.(event);
    if (!event.defaultPrevented) context.open(event);
  };

  if (asChild && React.isValidElement<Record<string, unknown>>(children)) {
    const childOnContextMenu = children.props.onContextMenu as
      | React.MouseEventHandler<HTMLElement>
      | undefined;
    return React.cloneElement(children, {
      ...props,
      onContextMenu: (event: React.MouseEvent<HTMLElement>) => {
        childOnContextMenu?.(event);
        if (!event.defaultPrevented) handleContextMenu(event);
      },
    });
  }

  return (
    <span {...props} onContextMenu={handleContextMenu}>
      {children}
    </span>
  );
}

interface NativeComponentProps {
  children?: React.ReactNode;
  className?: string;
}

const ContextMenuContent: React.FC<NativeComponentProps> = () => null;

function ContextMenuGroup({ children }: NativeComponentProps) {
  return <>{children}</>;
}

interface ContextMenuItemProps extends NativeComponentProps {
  accelerator?: string;
  disabled?: boolean;
  id?: string;
  inset?: boolean;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  onSelect?: (event: Event) => void;
  textValue?: string;
  variant?: "default" | "destructive";
}

const ContextMenuItem: React.FC<ContextMenuItemProps> = () => null;

interface ContextMenuCheckboxItemProps extends ContextMenuItemProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const ContextMenuCheckboxItem: React.FC<ContextMenuCheckboxItemProps> = () => null;

interface ContextMenuRadioGroupProps extends NativeComponentProps {
  onValueChange?: (value: string) => void;
  value?: string;
}

function ContextMenuRadioGroup({ children }: ContextMenuRadioGroupProps) {
  return <>{children}</>;
}

interface ContextMenuRadioItemProps extends ContextMenuItemProps {
  value: string;
}

const ContextMenuRadioItem: React.FC<ContextMenuRadioItemProps> = () => null;

const ContextMenuLabel: React.FC<NativeComponentProps & { inset?: boolean }> = () => null;

const ContextMenuSeparator: React.FC<Omit<NativeComponentProps, "children">> = () => null;

const ContextMenuShortcut: React.FC<React.ComponentProps<"span">> = () => null;

function ContextMenuSub({ children }: NativeComponentProps) {
  return <>{children}</>;
}

const ContextMenuSubTrigger: React.FC<ContextMenuItemProps> = () => null;

function ContextMenuSubContent({ children }: NativeComponentProps) {
  return <>{children}</>;
}

function ContextMenuPortal({ children }: NativeComponentProps) {
  return <>{children}</>;
}

export {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuPortal,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
};
