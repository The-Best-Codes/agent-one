import { describe, expect, it } from "vitest";
import { kbdRegistry } from "./kbd-registry";

describe("kbdRegistry", () => {
  it("should have all expected keyboard shortcuts defined", () => {
    expect(kbdRegistry).toBeDefined();
    expect(typeof kbdRegistry).toBe("object");
  });

  describe("shortcut keys", () => {
    it("should have focusMainChatInput shortcut", () => {
      expect(kbdRegistry.focusMainChatInput).toBe("ctrl+l");
    });

    it("should have openSettings shortcut", () => {
      expect(kbdRegistry.openSettings).toBe("ctrl+comma");
    });

    it("should have openTests shortcut", () => {
      expect(kbdRegistry.openTests).toBe("ctrl+shift+q");
    });

    it("should have newChat shortcut", () => {
      expect(kbdRegistry.newChat).toBe("ctrl+n");
    });

    it("should have focusChatSearch shortcut", () => {
      expect(kbdRegistry.focusChatSearch).toBe("ctrl+k");
    });

    it("should have focusChatSearchCollapsed shortcut", () => {
      expect(kbdRegistry.focusChatSearchCollapsed).toBe("ctrl+k");
    });

    it("should have toggleSidebar shortcut", () => {
      expect(kbdRegistry.toggleSidebar).toBe("ctrl+b");
    });
  });

  describe("shortcut consistency", () => {
    it("should use consistent ctrl+ prefix for all shortcuts", () => {
      const shortcuts = Object.values(kbdRegistry);
      shortcuts.forEach((shortcut) => {
        expect(shortcut).toMatch(/^ctrl\+/);
      });
    });

    it("should not have duplicate shortcuts (except intentional ones)", () => {
      const shortcuts = Object.values(kbdRegistry);
      const uniqueShortcuts = new Set(shortcuts);
      // We expect focusChatSearch and focusChatSearchCollapsed to be the same
      expect(shortcuts.length).toBe(7);
      expect(uniqueShortcuts.size).toBe(6);
    });

    it("should have focusChatSearch and focusChatSearchCollapsed as the same", () => {
      expect(kbdRegistry.focusChatSearch).toBe(
        kbdRegistry.focusChatSearchCollapsed,
      );
    });
  });

  describe("shortcut format validation", () => {
    it("should have valid keyboard shortcut formats", () => {
      const validShortcutRegex = /^(ctrl|alt|shift|meta)(\+(ctrl|alt|shift|meta))*\+[a-z0-9,]+$/;
      const shortcuts = Object.values(kbdRegistry);
      shortcuts.forEach((shortcut) => {
        expect(shortcut).toMatch(validShortcutRegex);
      });
    });
  });

  describe("registry completeness", () => {
    it("should have exactly 7 registered shortcuts", () => {
      const keys = Object.keys(kbdRegistry);
      expect(keys).toHaveLength(7);
    });

    it("should contain all expected shortcut names", () => {
      const expectedKeys = [
        "focusMainChatInput",
        "openSettings",
        "openTests",
        "newChat",
        "focusChatSearch",
        "focusChatSearchCollapsed",
        "toggleSidebar",
      ];
      const actualKeys = Object.keys(kbdRegistry);
      expect(actualKeys.sort()).toEqual(expectedKeys.sort());
    });
  });
});
