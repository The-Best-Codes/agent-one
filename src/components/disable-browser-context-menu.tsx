"use client";

import * as React from "react";

const textInputTypes = new Set(["email", "number", "password", "search", "tel", "text", "url"]);

function hasEditableContext(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;

  const input = target.closest("input");
  if (input instanceof HTMLInputElement && textInputTypes.has(input.type)) return true;
  if (target.closest("textarea")) return true;

  const editable = target.closest("[contenteditable]");
  return editable instanceof HTMLElement && editable.isContentEditable;
}

function hasSelectedText(target: EventTarget | null): boolean {
  if (!(target instanceof Node)) return false;

  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || selection.toString().trim().length === 0) return false;

  for (let index = 0; index < selection.rangeCount; index += 1) {
    if (selection.getRangeAt(index).intersectsNode(target)) return true;
  }

  return false;
}

/**
 * Disables the browser context menu except for editable controls and selected text.
 */
function DisableBrowserContextMenu() {
  React.useEffect(() => {
    const handleContextMenu = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (hasEditableContext(event.target) || hasSelectedText(event.target)) return;
      event.preventDefault();
    };

    document.addEventListener("contextmenu", handleContextMenu);
    return () => document.removeEventListener("contextmenu", handleContextMenu);
  }, []);

  return null;
}

export { DisableBrowserContextMenu };
