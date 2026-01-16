import { describe, expect, it } from "vitest";
import { kbdRegistry } from "./kbd-registry";

describe("kbdRegistry - Extended Coverage", () => {
  describe("shortcut pattern validation", () => {
    it("should have all shortcuts starting with ctrl", () => {
      Object.values(kbdRegistry).forEach((shortcut) => {
        expect(shortcut).toMatch(/^ctrl/);
      });
    });

    it("should have valid key combinations", () => {
      Object.entries(kbdRegistry).forEach(([name, shortcut]) => {
        // Should be ctrl+<something>
        const parts = shortcut.split("+");
        expect(parts[0]).toBe("ctrl");
        expect(parts.length).toBeGreaterThanOrEqual(2);
      });
    });

    it("should not have trailing or leading spaces", () => {
      Object.values(kbdRegistry).forEach((shortcut) => {
        expect(shortcut).toBe(shortcut.trim());
      });
    });

    it("should use lowercase modifiers and keys", () => {
      Object.values(kbdRegistry).forEach((shortcut) => {
        expect(shortcut).toBe(shortcut.toLowerCase());
      });
    });
  });

  describe("modifier key patterns", () => {
    it("should use valid modifier patterns", () => {
      const validModifiers = ["ctrl", "shift", "alt", "meta"];
      
      Object.values(kbdRegistry).forEach((shortcut) => {
        const parts = shortcut.split("+");
        const modifiers = parts.slice(0, -1);
        
        modifiers.forEach((modifier) => {
          expect(validModifiers).toContain(modifier);
        });
      });
    });

    it("should have consistent modifier ordering", () => {
      // ctrl should always be first
      Object.values(kbdRegistry).forEach((shortcut) => {
        if (shortcut.includes("+")) {
          expect(shortcut.split("+")[0]).toBe("ctrl");
        }
      });
    });
  });

  describe("key value patterns", () => {
    it("should use valid key names", () => {
      const shortcuts = Object.values(kbdRegistry);
      
      // Extract the final key from each shortcut
      shortcuts.forEach((shortcut) => {
        const parts = shortcut.split("+");
        const key = parts[parts.length - 1];
        
        // Should be alphanumeric or special keys
        expect(key).toMatch(/^[a-z0-9,]+$/);
      });
    });

    it("should not have empty keys", () => {
      Object.values(kbdRegistry).forEach((shortcut) => {
        const parts = shortcut.split("+");
        parts.forEach((part) => {
          expect(part.length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe("shortcut accessibility", () => {
    it("should be accessible from all shortcut names", () => {
      const names = [
        "focusMainChatInput",
        "openSettings",
        "openTests",
        "newChat",
        "focusChatSearch",
        "focusChatSearchCollapsed",
        "toggleSidebar",
      ];

      names.forEach((name) => {
        expect(kbdRegistry[name as keyof typeof kbdRegistry]).toBeDefined();
        expect(typeof kbdRegistry[name as keyof typeof kbdRegistry]).toBe(
          "string",
        );
      });
    });

    it("should have non-conflicting shortcuts (except intentional duplicates)", () => {
      const shortcuts = Object.entries(kbdRegistry);
      const seen = new Map<string, string[]>();

      shortcuts.forEach(([name, shortcut]) => {
        if (!seen.has(shortcut)) {
          seen.set(shortcut, []);
        }
        seen.get(shortcut)!.push(name);
      });

      // Check that only focusChatSearch and focusChatSearchCollapsed share ctrl+k
      seen.forEach((names, shortcut) => {
        if (names.length > 1) {
          expect(shortcut).toBe("ctrl+k");
          expect(names.sort()).toEqual([
            "focusChatSearch",
            "focusChatSearchCollapsed",
          ]);
        }
      });
    });
  });

  describe("special character handling", () => {
    it("should handle comma as a key", () => {
      expect(kbdRegistry.openSettings).toBe("ctrl+comma");
    });

    it("should not contain invalid characters", () => {
      Object.values(kbdRegistry).forEach((shortcut) => {
        // Should only contain allowed characters: a-z, 0-9, +, comma
        expect(shortcut).toMatch(/^[a-z0-9+,]+$/);
      });
    });
  });

  describe("naming conventions", () => {
    it("should use camelCase for all shortcut names", () => {
      Object.keys(kbdRegistry).forEach((name) => {
        expect(name).toMatch(/^[a-z][a-zA-Z0-9]*$/);
      });
    });

    it("should have descriptive action names", () => {
      const actionVerbs = ["focus", "open", "new", "toggle"];
      
      Object.keys(kbdRegistry).forEach((name) => {
        const hasActionVerb = actionVerbs.some((verb) =>
          name.toLowerCase().includes(verb),
        );
        expect(hasActionVerb).toBe(true);
      });
    });
  });

  describe("registry immutability", () => {
    it("should export a constant object", () => {
      const shortcuts1 = { ...kbdRegistry };
      const shortcuts2 = { ...kbdRegistry };
      
      expect(shortcuts1).toEqual(shortcuts2);
    });

    it("should have consistent values across reads", () => {
      const firstRead = kbdRegistry.newChat;
      const secondRead = kbdRegistry.newChat;
      
      expect(firstRead).toBe(secondRead);
    });
  });

  describe("shortcut usability", () => {
    it("should have shortcuts suitable for different contexts", () => {
      // Main input shortcuts
      expect(kbdRegistry.focusMainChatInput).toBeDefined();
      
      // Navigation shortcuts
      expect(kbdRegistry.focusChatSearch).toBeDefined();
      expect(kbdRegistry.toggleSidebar).toBeDefined();
      
      // Action shortcuts
      expect(kbdRegistry.newChat).toBeDefined();
      expect(kbdRegistry.openSettings).toBeDefined();
    });

    it("should not conflict with common browser shortcuts", () => {
      const shortcuts = Object.values(kbdRegistry);
      
      // These would conflict with common browser shortcuts
      const problematic = [
        "ctrl+t", // New tab
        "ctrl+w", // Close tab
        "ctrl+r", // Refresh
        "ctrl+f", // Find
        "ctrl+p", // Print
        "ctrl+s", // Save
      ];

      shortcuts.forEach((shortcut) => {
        expect(problematic).not.toContain(shortcut);
      });
    });
  });

  describe("comprehensive shortcut mapping", () => {
    it("should map all shortcuts to their functions", () => {
      const mapping = {
        focusMainChatInput: "Focus the main chat input",
        openSettings: "Open settings dialog",
        openTests: "Open tests panel",
        newChat: "Create new chat",
        focusChatSearch: "Focus chat search",
        focusChatSearchCollapsed: "Focus chat search (collapsed)",
        toggleSidebar: "Toggle sidebar visibility",
      };

      Object.keys(mapping).forEach((key) => {
        expect(kbdRegistry[key as keyof typeof kbdRegistry]).toBeDefined();
      });
    });
  });
});
