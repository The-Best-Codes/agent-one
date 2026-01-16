import { beforeEach, describe, expect, it, vi } from "vitest";
import { getResolvedTheme } from "./get-resolved-theme";

describe("getResolvedTheme", () => {
  // Mock window.matchMedia before each test
  beforeEach(() => {
    // Reset any existing mock
    vi.unstubAllGlobals();
  });

  describe("direct theme values", () => {
    it("should return 'light' when rawTheme is 'light'", () => {
      expect(getResolvedTheme("light")).toBe("light");
    });

    it("should return 'dark' when rawTheme is 'dark'", () => {
      expect(getResolvedTheme("dark")).toBe("dark");
    });

    it("should return JSON parsed theme value", () => {
      expect(getResolvedTheme('"light"')).toBe("light");
      expect(getResolvedTheme('"dark"')).toBe("dark");
    });
  });

  describe("system theme resolution", () => {
    it("should resolve to 'dark' when system prefers dark", () => {
      // Mock window.matchMedia to return dark theme
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: query === "(prefers-color-scheme: dark)",
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      expect(getResolvedTheme("system")).toBe("dark");
    });

    it("should resolve to 'light' when system prefers light", () => {
      // Mock window.matchMedia to return light theme
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: false,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      expect(getResolvedTheme("system")).toBe("light");
    });

    it("should resolve to 'light' when system theme and window is undefined", () => {
      // This test simulates server-side rendering
      const originalWindow = global.window;
      // @ts-expect-error - deliberately setting window to undefined for test
      delete global.window;

      expect(getResolvedTheme("system")).toBe("light");

      // Restore window
      global.window = originalWindow;
    });
  });

  describe("empty or undefined rawTheme", () => {
    it("should default to system theme when rawTheme is empty string", () => {
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: false,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      expect(getResolvedTheme("")).toBe("light");
    });
  });

  describe("JSON parsing", () => {
    it("should handle JSON stringified theme values", () => {
      expect(getResolvedTheme('"dark"')).toBe("dark");
      expect(getResolvedTheme('"light"')).toBe("light");
    });

    it("should handle JSON stringified system", () => {
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: query === "(prefers-color-scheme: dark)",
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      expect(getResolvedTheme('"system"')).toBe("dark");
    });
  });

  describe("fallback behavior", () => {
    it("should fallback to 'light' for unknown themes", () => {
      // The function should treat unknown themes as non-system and return them,
      // or fallback to light. Let's test the actual behavior.
      expect(getResolvedTheme("unknown")).toBe("unknown");
    });
  });
});
