import { describe, expect, it } from "vitest";
import formatBytes from "@/lib/format-bytes";

describe("formatBytes - Additional Edge Cases", () => {
  describe("precision and rounding", () => {
    it("should round to specified decimal places correctly", () => {
      // Test rounding up
      expect(formatBytes(1536, false, 1)).toBe("1.5 KiB");
      expect(formatBytes(1638, false, 1)).toBe("1.6 KiB");
      expect(formatBytes(1945, false, 1)).toBe("1.9 KiB");

      // Test rounding down
      expect(formatBytes(1126, false, 1)).toBe("1.1 KiB");
      expect(formatBytes(1434, false, 1)).toBe("1.4 KiB");
    });

    it("should handle 0 decimal places", () => {
      expect(formatBytes(1024, false, 0)).toBe("1 KiB");
      expect(formatBytes(1536, false, 0)).toBe("2 KiB");
      expect(formatBytes(512, false, 0)).toBe("512 B");
    });

    it("should handle many decimal places", () => {
      expect(formatBytes(1536, false, 5)).toBe("1.50000 KiB");
      expect(formatBytes(1024, false, 3)).toBe("1.000 KiB");
    });
  });

  describe("boundary values between units", () => {
    it("should correctly handle values at unit boundaries (binary)", () => {
      expect(formatBytes(1023, false, 1)).toBe("1023 B");
      expect(formatBytes(1024, false, 1)).toBe("1.0 KiB");
      expect(formatBytes(1025, false, 1)).toBe("1.0 KiB");

      expect(formatBytes(1024 * 1023, false, 1)).toBe("1023.0 KiB");
      expect(formatBytes(1024 * 1024, false, 1)).toBe("1.0 MiB");
    });

    it("should correctly handle values at unit boundaries (metric)", () => {
      expect(formatBytes(999, true, 1)).toBe("999 B");
      expect(formatBytes(1000, true, 1)).toBe("1.0 kB");
      expect(formatBytes(1001, true, 1)).toBe("1.0 kB");

      expect(formatBytes(1000 * 999, true, 1)).toBe("999.0 kB");
      expect(formatBytes(1000 * 1000, true, 1)).toBe("1.0 MB");
    });
  });

  describe("all unit levels", () => {
    it("should format all binary units correctly", () => {
      const units = [
        { size: 1024, expected: "1.0 KiB" },
        { size: 1024 ** 2, expected: "1.0 MiB" },
        { size: 1024 ** 3, expected: "1.0 GiB" },
        { size: 1024 ** 4, expected: "1.0 TiB" },
        { size: 1024 ** 5, expected: "1.0 PiB" },
        { size: 1024 ** 6, expected: "1.0 EiB" },
        { size: 1024 ** 7, expected: "1.0 ZiB" },
        { size: 1024 ** 8, expected: "1.0 YiB" },
      ];

      units.forEach(({ size, expected }) => {
        expect(formatBytes(size, false, 1)).toBe(expected);
      });
    });

    it("should format all metric units correctly", () => {
      const units = [
        { size: 1000, expected: "1.0 kB" },
        { size: 1000 ** 2, expected: "1.0 MB" },
        { size: 1000 ** 3, expected: "1.0 GB" },
        { size: 1000 ** 4, expected: "1.0 TB" },
        { size: 1000 ** 5, expected: "1.0 PB" },
        { size: 1000 ** 6, expected: "1.0 EB" },
        { size: 1000 ** 7, expected: "1.0 ZB" },
        { size: 1000 ** 8, expected: "1.0 YB" },
      ];

      units.forEach(({ size, expected }) => {
        expect(formatBytes(size, true, 1)).toBe(expected);
      });
    });
  });

  describe("real-world file sizes", () => {
    it("should format common file sizes correctly", () => {
      expect(formatBytes(100)).toBe("100 B"); // Tiny text file
      expect(formatBytes(5 * 1024)).toBe("5.0 KiB"); // Small image
      expect(formatBytes(500 * 1024)).toBe("500.0 KiB"); // Medium image
      expect(formatBytes(3 * 1024 * 1024)).toBe("3.0 MiB"); // MP3 file
      expect(formatBytes(700 * 1024 * 1024)).toBe("700.0 MiB"); // CD ISO
      expect(formatBytes(4.7 * 1024 * 1024 * 1024)).toBe("4.7 GiB"); // DVD ISO
      expect(formatBytes(50 * 1024 * 1024 * 1024)).toBe("50.0 GiB"); // Blu-ray ISO
    });

    it("should format disk sizes correctly", () => {
      expect(formatBytes(128 * 1024 * 1024 * 1024)).toBe("128.0 GiB"); // SSD
      expect(formatBytes(1024 * 1024 * 1024 * 1024)).toBe("1.0 TiB"); // 1TB HDD
      expect(formatBytes(4 * 1024 * 1024 * 1024 * 1024)).toBe("4.0 TiB"); // 4TB HDD
    });
  });

  describe("negative numbers", () => {
    it("should handle negative bytes at all levels", () => {
      expect(formatBytes(-100)).toBe("-100 B");
      expect(formatBytes(-1024)).toBe("-1.0 KiB");
      expect(formatBytes(-1024 * 1024)).toBe("-1.0 MiB");
      expect(formatBytes(-1024 * 1024 * 1024)).toBe("-1.0 GiB");
    });

    it("should handle negative fractional values", () => {
      expect(formatBytes(-1536, false, 1)).toBe("-1.5 KiB");
      expect(formatBytes(-2.5 * 1024 * 1024, false, 1)).toBe("-2.5 MiB");
    });
  });

  describe("fractional bytes", () => {
    it("should handle fractional bytes correctly", () => {
      expect(formatBytes(0.1)).toBe("0.1 B");
      expect(formatBytes(0.5)).toBe("0.5 B");
      expect(formatBytes(0.9)).toBe("0.9 B");
    });

    it("should handle fractional KiB", () => {
      expect(formatBytes(1024.5, false, 1)).toBe("1.0 KiB");
      expect(formatBytes(1536.8, false, 2)).toBe("1.50 KiB");
    });
  });

  describe("metric vs binary comparison", () => {
    it("should show difference between metric and binary for same value", () => {
      const size = 1024 * 1024 * 1024; // 1 GiB
      const binary = formatBytes(size, false, 2);
      const metric = formatBytes(size, true, 2);

      expect(binary).toBe("1.00 GiB");
      expect(metric).toBe("1.07 GB"); // 1 GiB = 1.073741824 GB
    });

    it("should show larger difference at higher magnitudes", () => {
      const size = 1024 * 1024 * 1024 * 1024; // 1 TiB
      const binary = formatBytes(size, false, 2);
      const metric = formatBytes(size, true, 2);

      expect(binary).toBe("1.00 TiB");
      expect(metric).toBe("1.10 TB"); // 1 TiB ≈ 1.099 TB
    });
  });

  describe("special numeric values", () => {
    it("should handle very small positive numbers", () => {
      expect(formatBytes(0.001)).toBe("0.001 B");
      expect(formatBytes(0.0001)).toBe("0.0001 B");
    });

    it("should handle numbers close to unit boundaries", () => {
      expect(formatBytes(1023.9, false, 1)).toBe("1023.9 B");
      expect(formatBytes(1024.1, false, 1)).toBe("1.0 KiB");
    });
  });
});
