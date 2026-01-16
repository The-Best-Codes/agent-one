import { describe, expect, it } from "vitest";
import formatBytes from "./format-bytes";

describe("formatBytes", () => {
  describe("binary units (IEC)", () => {
    it("should format bytes less than 1024 as 'B'", () => {
      expect(formatBytes(0)).toBe("0 B");
      expect(formatBytes(1)).toBe("1 B");
      expect(formatBytes(512)).toBe("512 B");
      expect(formatBytes(1023)).toBe("1023 B");
    });

    it("should format KiB correctly", () => {
      expect(formatBytes(1024)).toBe("1.0 KiB");
      expect(formatBytes(2048)).toBe("2.0 KiB");
      expect(formatBytes(1536)).toBe("1.5 KiB");
    });

    it("should format MiB correctly", () => {
      expect(formatBytes(1024 * 1024)).toBe("1.0 MiB");
      expect(formatBytes(1024 * 1024 * 2.5)).toBe("2.5 MiB");
    });

    it("should format GiB correctly", () => {
      expect(formatBytes(1024 * 1024 * 1024)).toBe("1.0 GiB");
      expect(formatBytes(1024 * 1024 * 1024 * 5)).toBe("5.0 GiB");
    });

    it("should format TiB correctly", () => {
      expect(formatBytes(1024 * 1024 * 1024 * 1024)).toBe("1.0 TiB");
    });

    it("should handle negative values", () => {
      expect(formatBytes(-1)).toBe("-1 B");
      expect(formatBytes(-1024)).toBe("-1.0 KiB");
      expect(formatBytes(-1024 * 1024)).toBe("-1.0 MiB");
    });
  });

  describe("metric units (SI)", () => {
    it("should format bytes less than 1000 as 'B'", () => {
      expect(formatBytes(0, true)).toBe("0 B");
      expect(formatBytes(1, true)).toBe("1 B");
      expect(formatBytes(500, true)).toBe("500 B");
      expect(formatBytes(999, true)).toBe("999 B");
    });

    it("should format kB correctly", () => {
      expect(formatBytes(1000, true)).toBe("1.0 kB");
      expect(formatBytes(2000, true)).toBe("2.0 kB");
      expect(formatBytes(1500, true)).toBe("1.5 kB");
    });

    it("should format MB correctly", () => {
      expect(formatBytes(1000 * 1000, true)).toBe("1.0 MB");
      expect(formatBytes(1000 * 1000 * 3.7, true)).toBe("3.7 MB");
    });

    it("should format GB correctly", () => {
      expect(formatBytes(1000 * 1000 * 1000, true)).toBe("1.0 GB");
      expect(formatBytes(1000 * 1000 * 1000 * 2, true)).toBe("2.0 GB");
    });

    it("should handle negative values", () => {
      expect(formatBytes(-1, true)).toBe("-1 B");
      expect(formatBytes(-1000, true)).toBe("-1.0 kB");
      expect(formatBytes(-1000 * 1000, true)).toBe("-1.0 MB");
    });
  });

  describe("decimal places", () => {
    it("should respect custom decimal places", () => {
      expect(formatBytes(1536, false, 0)).toBe("2 KiB");
      expect(formatBytes(1536, false, 2)).toBe("1.50 KiB");
      expect(formatBytes(1536, false, 3)).toBe("1.500 KiB");
    });

    it("should round correctly", () => {
      expect(formatBytes(1234, false, 1)).toBe("1.2 KiB");
      expect(formatBytes(1638, false, 1)).toBe("1.6 KiB");
    });
  });

  describe("edge cases", () => {
    it("should handle very large numbers", () => {
      const yobibyte = Math.pow(1024, 8);
      expect(formatBytes(yobibyte)).toBe("1.0 YiB");
      expect(formatBytes(yobibyte * 2)).toBe("2.0 YiB");
    });

    it("should handle very small negative numbers", () => {
      expect(formatBytes(-0.5)).toBe("-0.5 B");
    });

    it("should handle fractional bytes", () => {
      expect(formatBytes(123.456)).toBe("123.456 B");
    });
  });
});
