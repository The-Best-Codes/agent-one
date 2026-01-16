import { beforeEach, describe, expect, it, vi } from "vitest";
import { getResolvedTheme } from "@/lib/get-resolved-theme";

describe("getResolvedTheme - Extended Coverage", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  describe("JSON parsing edge cases", () => {
    it("should handle double-quoted JSON strings", () => {
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation(() => ({
          matches: false,
          media: "",
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      expect(getResolvedTheme('"light"')).toBe("light");
      expect(getResolvedTheme('"dark"')).toBe("dark");
      expect(getResolvedTheme('"system"')).toBe("light");
    });

    it("should parse nested JSON as object", () => {
      // jsonParseCatch will parse the JSON string into an object
      const result = getResolvedTheme('{"theme":"light"}');
      expect(typeof result).toBe("object");
    });

    it("should handle invalid JSON strings", () => {
      expect(getResolvedTheme("{invalid}")).toBe("{invalid}");
    });
  });

  describe("custom theme values", () => {
    it("should return custom theme names as-is", () => {
      expect(getResolvedTheme("blue")).toBe("blue");
      expect(getResolvedTheme("custom-theme")).toBe("custom-theme");
      expect(getResolvedTheme("theme-123")).toBe("theme-123");
    });

    it("should handle theme names with special characters", () => {
      expect(getResolvedTheme("theme_name")).toBe("theme_name");
      expect(getResolvedTheme("theme-name")).toBe("theme-name");
    });
  });

  describe("system theme with different media query results", () => {
    it("should detect dark system theme correctly", () => {
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

    it("should detect light system theme correctly", () => {
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation(() => ({
          matches: false,
          media: "",
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
  });

  describe("falsy values", () => {
    it("should parse JSON null string to null value", () => {
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation(() => ({
          matches: false,
          media: "",
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      // jsonParseCatch will parse "null" string as the null value
      const result = getResolvedTheme("null");
      expect(result).toBe(null);
    });

    it("should handle undefined gracefully", () => {
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation(() => ({
          matches: false,
          media: "",
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      expect(getResolvedTheme(undefined as unknown as string)).toBe("light");
    });
  });

  describe("mixed case theme values", () => {
    it("should handle mixed case theme names", () => {
      expect(getResolvedTheme("Light")).toBe("Light");
      expect(getResolvedTheme("Dark")).toBe("Dark");
      expect(getResolvedTheme("LIGHT")).toBe("LIGHT");
    });

    it("should handle mixed case system", () => {
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation(() => ({
          matches: false,
          media: "",
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      expect(getResolvedTheme("System")).toBe("System");
      expect(getResolvedTheme("SYSTEM")).toBe("SYSTEM");
    });
  });

  describe("whitespace handling", () => {
    it("should handle themes with whitespace", () => {
      expect(getResolvedTheme(" light ")).toBe(" light ");
      expect(getResolvedTheme("light ")).toBe("light ");
    });

    it("should handle empty string as falsy", () => {
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation(() => ({
          matches: false,
          media: "",
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

  describe("server-side rendering simulation", () => {
    it("should fallback to light when window is undefined", () => {
      const originalWindow = global.window;
      // @ts-expect-error - deliberately setting window to undefined for test
      delete global.window;

      expect(getResolvedTheme("system")).toBe("light");

      global.window = originalWindow;
    });
  });

  describe("consistency checks", () => {
    it("should return same result for same input", () => {
      const result1 = getResolvedTheme("light");
      const result2 = getResolvedTheme("light");
      expect(result1).toBe(result2);
    });

    it("should handle rapid successive calls", () => {
      const results = Array(10)
        .fill(null)
        .map(() => getResolvedTheme("dark"));
      results.forEach((result) => {
        expect(result).toBe("dark");
      });
    });
  });
});
