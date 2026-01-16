import { describe, expect, it } from "vitest";
import { getAiErrorMessageUx, aiErrorMessages } from "./ai-error-messages";

describe("aiErrorMessages - Extended Coverage", () => {
  describe("error message set structure", () => {
    it("should have correct structure for each error config", () => {
      aiErrorMessages.forEach((config) => {
        expect(config).toHaveProperty("key");
        expect(config).toHaveProperty("uxError");
        expect(config).toHaveProperty("description");
        expect(typeof config.key).toBe("string");
        expect(typeof config.uxError).toBe("string");
        expect(typeof config.description).toBe("string");
      });
    });

    it("should have at least 2 error patterns", () => {
      expect(aiErrorMessages.size).toBeGreaterThanOrEqual(2);
    });

    it("should not have duplicate keys", () => {
      const keys = Array.from(aiErrorMessages).map((c) => c.key.toLowerCase());
      const uniqueKeys = new Set(keys);
      expect(keys.length).toBe(uniqueKeys.size);
    });
  });

  describe("getAiErrorMessageUx - complex scenarios", () => {
    it("should handle error with multiple matching patterns", () => {
      // If error contains multiple patterns, first match wins
      const result = getAiErrorMessageUx("Failed to fetch the image file");
      expect(result.message).toBe("Failed to connect to AI model.");
    });

    it("should handle very long error messages", () => {
      const longError = "Failed to fetch " + "x".repeat(1000);
      const result = getAiErrorMessageUx(longError);
      expect(result.message).toBe("Failed to connect to AI model.");
    });

    it("should handle error with newlines", () => {
      const errorWithNewlines = "Error:\nFailed to fetch\nMore details";
      const result = getAiErrorMessageUx(errorWithNewlines);
      expect(result.message).toBe("Failed to connect to AI model.");
    });

    it("should handle error with special characters", () => {
      const errorWithSpecial = "Error: Failed to fetch (timeout: 30s)";
      const result = getAiErrorMessageUx(errorWithSpecial);
      expect(result.message).toBe("Failed to connect to AI model.");
    });
  });

  describe("case insensitivity edge cases", () => {
    it("should match with mixed case", () => {
      const result = getAiErrorMessageUx("FaIlEd To FeTcH");
      expect(result.message).toBe("Failed to connect to AI model.");
    });

    it("should match when pattern is in all caps", () => {
      const result = getAiErrorMessageUx("FAILED TO FETCH");
      expect(result.message).toBe("Failed to connect to AI model.");
    });

    it("should match when pattern is in all lowercase", () => {
      const result = getAiErrorMessageUx("failed to fetch");
      expect(result.message).toBe("Failed to connect to AI model.");
    });
  });

  describe("substring matching", () => {
    it("should match pattern at beginning", () => {
      const result = getAiErrorMessageUx("Failed to fetch data");
      expect(result.message).toBe("Failed to connect to AI model.");
    });

    it("should match pattern in middle", () => {
      const result = getAiErrorMessageUx("Network error: Failed to fetch");
      expect(result.message).toBe("Failed to connect to AI model.");
    });

    it("should match pattern at end", () => {
      const result = getAiErrorMessageUx("Request failed: Failed to fetch");
      expect(result.message).toBe("Failed to connect to AI model.");
    });
  });

  describe("whitespace handling", () => {
    it("should trim leading and trailing spaces", () => {
      const result = getAiErrorMessageUx("  Failed to fetch  ");
      expect(result.message).toBe("Failed to connect to AI model.");
    });

    it("should handle tabs and newlines", () => {
      const result = getAiErrorMessageUx("\t\nFailed to fetch\n\t");
      expect(result.message).toBe("Failed to connect to AI model.");
    });
  });

  describe("all defined error patterns", () => {
    it("should detect 'Failed to fetch' errors", () => {
      const result = getAiErrorMessageUx("Failed to fetch");
      expect(result.message).toBe("Failed to connect to AI model.");
      expect(result.description).toContain("internet connection");
    });

    it("should detect non-image file errors", () => {
      const result = getAiErrorMessageUx(
        "'Non-image file content parts' functionality not supported.",
      );
      expect(result.message).toBe(
        "Only image files are supported by this model.",
      );
      expect(result.description).toContain("non-image files");
    });
  });

  describe("response format consistency", () => {
    it("should always return an object with message and description", () => {
      const result = getAiErrorMessageUx("any error");
      expect(result).toHaveProperty("message");
      expect(result).toHaveProperty("description");
    });

    it("should return null message for unknown errors", () => {
      const result = getAiErrorMessageUx("unknown error type");
      expect(result.message).toBe(null);
      expect(result.description).toBe("unknown error type");
    });

    it("should return message and description for known errors", () => {
      const result = getAiErrorMessageUx("Failed to fetch");
      expect(typeof result.message).toBe("string");
      expect(typeof result.description).toBe("string");
      expect(result.message).not.toBe(null);
    });
  });

  describe("error message variations", () => {
    it("should handle partial pattern matches", () => {
      const variations = [
        "Failed to fetch resource",
        "Connection failed to fetch",
        "fetch failed to connect",
      ];

      variations.forEach((variation) => {
        const result = getAiErrorMessageUx(variation);
        if (variation.toLowerCase().includes("failed to fetch")) {
          expect(result.message).toBe("Failed to connect to AI model.");
        }
      });
    });
  });
});
