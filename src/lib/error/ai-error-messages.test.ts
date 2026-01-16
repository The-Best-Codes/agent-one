import { describe, expect, it } from "vitest";
import { getAiErrorMessageUx } from "./ai-error-messages";

describe("getAiErrorMessageUx", () => {
  describe("known error patterns", () => {
    it("should detect 'Failed to fetch' errors", () => {
      const result = getAiErrorMessageUx("Failed to fetch");
      expect(result.message).toBe("Failed to connect to AI model.");
      expect(result.description).toBe(
        "AgentOne couldn't connect to the provider of the AI model you've chosen. Try a different model and check your internet connection.",
      );
    });

    it("should detect non-image file content errors", () => {
      const result = getAiErrorMessageUx(
        "'Non-image file content parts' functionality not supported.",
      );
      expect(result.message).toBe(
        "Only image files are supported by this model.",
      );
      expect(result.description).toBe(
        "The AI model you've chosen does not support non-image files. Please choose a different model or file type.",
      );
    });

    it("should handle case-insensitive matching", () => {
      const result = getAiErrorMessageUx("FAILED TO FETCH");
      expect(result.message).toBe("Failed to connect to AI model.");
    });

    it("should match errors containing the key", () => {
      const result = getAiErrorMessageUx(
        "Network error: Failed to fetch the resource",
      );
      expect(result.message).toBe("Failed to connect to AI model.");
    });
  });

  describe("unknown error patterns", () => {
    it("should return raw message for unknown errors", () => {
      const rawMessage = "This is an unknown error";
      const result = getAiErrorMessageUx(rawMessage);
      expect(result.message).toBe(null);
      expect(result.description).toBe(rawMessage);
    });

    it("should handle custom API errors", () => {
      const customError = "API rate limit exceeded";
      const result = getAiErrorMessageUx(customError);
      expect(result.message).toBe(null);
      expect(result.description).toBe(customError);
    });
  });

  describe("edge cases", () => {
    it("should handle null input", () => {
      const result = getAiErrorMessageUx(null);
      expect(result.message).toBe(null);
      expect(result.description).toBe("An unknown error occurred.");
    });

    it("should handle undefined input", () => {
      const result = getAiErrorMessageUx(undefined);
      expect(result.message).toBe(null);
      expect(result.description).toBe("An unknown error occurred.");
    });

    it("should handle empty string", () => {
      const result = getAiErrorMessageUx("");
      expect(result.message).toBe(null);
      expect(result.description).toBe("An unknown error occurred.");
    });

    it("should handle whitespace-only string", () => {
      const result = getAiErrorMessageUx("   ");
      expect(result.message).toBe(null);
      expect(result.description).toBe("An unknown error occurred.");
    });

    it("should trim whitespace from actual errors", () => {
      const result = getAiErrorMessageUx("  Failed to fetch  ");
      expect(result.message).toBe("Failed to connect to AI model.");
    });
  });

  describe("partial matches", () => {
    it("should match when error key appears in middle of message", () => {
      const result = getAiErrorMessageUx(
        "Error occurred: Failed to fetch data from server",
      );
      expect(result.message).toBe("Failed to connect to AI model.");
    });

    it("should match when error key appears at end of message", () => {
      const result = getAiErrorMessageUx(
        "Network connection issue: Failed to fetch",
      );
      expect(result.message).toBe("Failed to connect to AI model.");
    });
  });
});
