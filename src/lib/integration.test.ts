import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";
import formatBytes from "@/lib/format-bytes";
import { fixUrl } from "@/lib/fix-url";
import { jsonParseCatch } from "@/lib/json-parse-catch";
import { getError } from "@/lib/error/get-error";
import { getAiErrorMessageUx } from "@/lib/error/ai-error-messages";

describe("Utility Integration Tests", () => {
  describe("Combined utility usage scenarios", () => {
    it("should format file sizes and combine with className utilities", () => {
      const fileSize = 1048576; // 1 MB
      const formattedSize = formatBytes(fileSize);
      const className = cn("file-size", formattedSize.includes("MiB") && "large-file");

      expect(formattedSize).toBe("1.0 MiB");
      expect(className).toBe("file-size large-file");
    });

    it("should fix URLs and handle errors gracefully", () => {
      const urls = [
        "example.com",
        "https://example.com",
        "//example.com",
        "   example.com   ",
      ];

      const fixedUrls = urls.map(url => fixUrl(url));

      expect(fixedUrls).toEqual([
        "https://example.com",
        "https://example.com",
        "https://example.com",
        "https://example.com",
      ]);
    });

    it("should parse JSON and handle errors with consistent error messages", () => {
      const validJson = '{"key": "value"}';
      const invalidJson = "{invalid json}";

      const parsed = jsonParseCatch(validJson);
      const failed = jsonParseCatch(invalidJson);

      expect(parsed).toEqual({ key: "value" });
      expect(failed).toBe("{invalid json}");

      // Create an error from the failed parse
      const error = new Error(`Failed to process: ${failed}`);
      const errorMessage = getError(error);

      expect(errorMessage).toContain("Failed to process");
    });

    it("should handle AI errors with user-friendly messages", () => {
      const rawError = "Failed to fetch";
      const errorObj = new Error(rawError);

      const errorMessage = getError(errorObj);
      const uxError = getAiErrorMessageUx(errorMessage);

      expect(uxError.message).toBe("Failed to connect to AI model.");
      expect(uxError.description).toContain("internet connection");
    });
  });

  describe("Edge cases across utilities", () => {
    it("should handle empty and null values consistently", () => {
      expect(jsonParseCatch(null)).toBe(null);
      expect(jsonParseCatch(undefined)).toBe(undefined);
      expect(jsonParseCatch("")).toBe("");

      expect(getError(undefined)).toBe("Unknown error");

      expect(cn("", null, undefined, "valid")).toBe("valid");
    });

    it("should handle extreme values in formatBytes", () => {
      expect(formatBytes(0)).toBe("0 B");
      expect(formatBytes(Number.MAX_SAFE_INTEGER)).toContain("PiB");
      expect(formatBytes(-1024)).toBe("-1.0 KiB");
      expect(formatBytes(0.5)).toBe("0.5 B");
    });

    it("should handle special characters in URLs", () => {
      const specialUrls = [
        "example.com/path?param=value&other=test",
        "example.com/path#section",
        "example.com:8080/path",
      ];

      specialUrls.forEach(url => {
        const fixed = fixUrl(url);
        expect(fixed).toMatch(/^https:\/\//);
      });
    });

    it("should handle nested JSON parsing", () => {
      const nested = '{"level1": {"level2": {"level3": "value"}}}';
      const parsed = jsonParseCatch(nested);

      expect(parsed).toEqual({
        level1: { level2: { level3: "value" } },
      });
    });
  });

  describe("Real-world usage patterns", () => {
    it("should handle file upload scenario with size validation", () => {
      const maxSize = 5 * 1024 * 1024; // 5 MB
      const fileSize = 3 * 1024 * 1024; // 3 MB

      const formattedMax = formatBytes(maxSize);
      const formattedCurrent = formatBytes(fileSize);
      const isUnderLimit = fileSize < maxSize;

      expect(formattedMax).toBe("5.0 MiB");
      expect(formattedCurrent).toBe("3.0 MiB");
      expect(isUnderLimit).toBe(true);

      const className = cn(
        "file-upload",
        isUnderLimit ? "valid" : "invalid",
      );
      expect(className).toBe("file-upload valid");
    });

    it("should handle API response parsing and error handling", () => {
      const responses = [
        '{"status": "success", "data": {"items": [1, 2, 3]}}',
        '{"status": "error", "message": "Failed to fetch"}',
        "invalid json response",
      ];

      const results = responses.map(response => {
        const parsed = jsonParseCatch(response);
        if (typeof parsed === "object" && parsed !== null && "status" in parsed) {
          if (parsed.status === "error") {
            const uxError = getAiErrorMessageUx(parsed.message);
            return { type: "error", ...uxError };
          }
          return { type: "success", data: parsed };
        }
        return { type: "parse_error", raw: parsed };
      });

      expect(results[0].type).toBe("success");
      expect(results[1].type).toBe("error");
      expect(results[2].type).toBe("parse_error");
    });

    it("should handle dynamic styling based on file properties", () => {
      const files = [
        { name: "small.txt", size: 1024 },
        { name: "medium.pdf", size: 1024 * 1024 },
        { name: "large.zip", size: 10 * 1024 * 1024 },
      ];

      const styledFiles = files.map(file => ({
        ...file,
        formattedSize: formatBytes(file.size),
        className: cn(
          "file-item",
          file.size < 1024 * 1024 && "small",
          file.size >= 1024 * 1024 && file.size < 5 * 1024 * 1024 && "medium",
          file.size >= 5 * 1024 * 1024 && "large",
        ),
      }));

      expect(styledFiles[0].className).toBe("file-item small");
      expect(styledFiles[1].className).toBe("file-item medium");
      expect(styledFiles[2].className).toBe("file-item large");
    });
  });

  describe("Performance and boundary conditions", () => {
    it("should handle large arrays of class names efficiently", () => {
      const classes = Array(100).fill("class").map((c, i) => `${c}-${i}`);
      const result = cn(...classes);

      expect(result).toBeDefined();
      expect(result.split(" ").length).toBe(100);
    });

    it("should handle deeply nested JSON structures", () => {
      let nested: any = { value: "deep" };
      for (let i = 0; i < 10; i++) {
        nested = { level: nested };
      }

      const json = JSON.stringify(nested);
      const parsed = jsonParseCatch(json);

      expect(parsed).toBeDefined();
      expect(typeof parsed).toBe("object");
    });

    it("should handle URL edge cases consistently", () => {
      const edgeCases = [
        { input: "", expected: "https://" },
        { input: "   ", expected: "https://" },
        { input: "localhost", expected: "https://localhost" },
        { input: "127.0.0.1", expected: "https://127.0.0.1" },
        { input: "https://", expected: "https://" },
      ];

      edgeCases.forEach(({ input, expected }) => {
        expect(fixUrl(input)).toBe(expected);
      });
    });
  });
});
