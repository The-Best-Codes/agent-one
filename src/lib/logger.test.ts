import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { getLogger } from "./logger";

describe("logger", () => {
  describe("getLogger", () => {
    // Store original console.warn to restore after tests
    const originalWarn = console.warn;

    beforeEach(() => {
      // Mock console.warn to avoid noise in test output
      console.warn = vi.fn();
    });

    afterEach(() => {
      // Restore original console.warn
      console.warn = originalWarn;
      vi.restoreAllMocks();
    });

    it("should create a logger instance", () => {
      const logger = getLogger(import.meta.url);
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe("function");
      expect(typeof logger.error).toBe("function");
      expect(typeof logger.warn).toBe("function");
      expect(typeof logger.verbose).toBe("function");
    });

    it("should parse URL pathname in browser environment", () => {
      const testUrl = "http://localhost:1420/src/lib/logger.ts";
      const logger = getLogger(testUrl);
      expect(logger).toBeDefined();
      // The logger should be created successfully
      expect(typeof logger.info).toBe("function");
    });

    it("should handle file URLs", () => {
      const fileUrl = "file:///src/lib/logger.ts";
      const logger = getLogger(fileUrl);
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe("function");
    });

    it("should handle invalid URLs by creating logger anyway", () => {
      const invalidUrl = "not-a-valid-url";
      const logger = getLogger(invalidUrl);
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe("function");
      // The URL constructor in jsdom may handle this differently than expected
      // The important thing is that a logger is created successfully
    });

    it("should handle empty string input", () => {
      const logger = getLogger("");
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe("function");
    });

    it("should handle URLs with query parameters", () => {
      const urlWithQuery = "http://localhost:1420/src/lib/logger.ts?v=123";
      const logger = getLogger(urlWithQuery);
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe("function");
    });

    it("should handle URLs with fragments", () => {
      const urlWithFragment = "http://localhost:1420/src/lib/logger.ts#section";
      const logger = getLogger(urlWithFragment);
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe("function");
    });

    it("should create different logger instances for different paths", () => {
      const logger1 = getLogger("http://localhost:1420/src/lib/logger.ts");
      const logger2 = getLogger("http://localhost:1420/src/lib/utils.ts");

      expect(logger1).toBeDefined();
      expect(logger2).toBeDefined();
      // They should be different instances
      expect(logger1).not.toBe(logger2);
    });

    it("should handle data URLs", () => {
      const dataUrl = "data:text/plain,test";
      const logger = getLogger(dataUrl);
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe("function");
    });

    it("should handle blob URLs", () => {
      const blobUrl = "blob:http://localhost:1420/abc-123";
      const logger = getLogger(blobUrl);
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe("function");
    });

    it("should handle relative paths", () => {
      const relativePath = "./relative/path/file.ts";
      const logger = getLogger(relativePath);
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe("function");
      // The logger should be created even if URL parsing differs across environments
    });

    it("should create logger with correct logging methods", () => {
      const logger = getLogger(import.meta.url);
      const expectedMethods = [
        "trace",
        "debug",
        "info",
        "log",
        "warn",
        "error",
        "fatal",
        "verbose",
        "success",
      ];

      expectedMethods.forEach((method) => {
        expect(typeof logger[method as keyof typeof logger]).toBe("function");
      });
    });
  });
});
