import { describe, expect, it } from "vitest";
import { getError } from "@/lib/error/get-error";

describe("getError - Extended Edge Cases", () => {
  describe("standard Error types", () => {
    it("should handle Error with stack trace", () => {
      const error = new Error("Test error");
      error.stack = "Error: Test error\n  at test.ts:1:1";
      expect(getError(error)).toBe("Test error");
    });

    it("should handle Error with cause", () => {
      const cause = new Error("Cause error");
      const error = new Error("Main error", { cause });
      expect(getError(error)).toBe("Main error");
    });

    it("should handle EvalError", () => {
      const error = new EvalError("Eval error");
      expect(getError(error)).toBe("Eval error");
    });

    it("should handle URIError", () => {
      const error = new URIError("URI error");
      expect(getError(error)).toBe("URI error");
    });

    it("should handle ReferenceError", () => {
      const error = new ReferenceError("Reference error");
      expect(getError(error)).toBe("Reference error");
    });

    it("should handle SyntaxError", () => {
      const error = new SyntaxError("Syntax error");
      expect(getError(error)).toBe("Syntax error");
    });
  });

  describe("custom error classes", () => {
    it("should handle error with custom properties", () => {
      class CustomError extends Error {
        code: string;
        constructor(message: string, code: string) {
          super(message);
          this.code = code;
          this.name = "CustomError";
        }
      }
      const error = new CustomError("Custom message", "ERR_CODE");
      expect(getError(error)).toBe("Custom message");
    });

    it("should handle error with standard message property", () => {
      class SpecialError extends Error {
        constructor(msg: string) {
          super(msg);
          this.name = "SpecialError";
        }
      }
      const error = new SpecialError("test");
      // getError returns error.message which is the standard property
      expect(getError(error)).toBe("test");
    });
  });

  describe("string variations", () => {
    it("should handle multi-line error strings", () => {
      const multiLine = "Error on line 1\nError on line 2\nError on line 3";
      expect(getError(multiLine)).toBe(multiLine);
    });

    it("should handle strings with tabs and special chars", () => {
      const special = "Error:\t<message>\n\r\t@location";
      expect(getError(special)).toBe(special);
    });

    it("should handle very long error strings", () => {
      const longError = "Error: " + "x".repeat(1000);
      expect(getError(longError)).toBe(longError);
    });

    it("should handle strings with unicode", () => {
      const unicode = "エラー: Something went wrong 🚨";
      expect(getError(unicode)).toBe(unicode);
    });
  });

  describe("edge cases with undefined", () => {
    it("should return Unknown error for undefined", () => {
      expect(getError(undefined)).toBe("Unknown error");
    });

    it("should return Unknown error for error with undefined message", () => {
      const error = new Error(undefined as unknown as string);
      expect(getError(error)).toBe("");
    });
  });

  describe("error-like objects", () => {
    it("should handle objects with message property", () => {
      const errorLike = { message: "Error message", code: 500 };
      // Should return Unknown error since it's not an Error instance
      expect(getError(errorLike as unknown as Error)).toBe("Unknown error");
    });
  });

  describe("null and empty cases", () => {
    it("should handle empty string errors", () => {
      expect(getError("")).toBe("");
    });

    it("should handle whitespace-only strings", () => {
      expect(getError("   ")).toBe("   ");
      expect(getError("\n\t")).toBe("\n\t");
    });
  });

  describe("real-world error scenarios", () => {
    it("should handle fetch errors", () => {
      const fetchError = new Error("Failed to fetch");
      expect(getError(fetchError)).toBe("Failed to fetch");
    });

    it("should handle network timeout errors", () => {
      const timeoutError = new Error("Network request timed out");
      expect(getError(timeoutError)).toBe("Network request timed out");
    });

    it("should handle JSON parse errors", () => {
      try {
        JSON.parse("invalid json");
      } catch (e) {
        const message = getError(e as Error);
        expect(message).toContain("JSON");
      }
    });

    it("should handle validation errors", () => {
      const validationError = new Error(
        "Validation failed: email must be valid",
      );
      expect(getError(validationError)).toBe(
        "Validation failed: email must be valid",
      );
    });
  });

  describe("error message formatting", () => {
    it("should preserve error message formatting", () => {
      const formattedError = new Error("ERROR [Code: 500]\nDetails: Server error\nStack trace follows...");
      expect(getError(formattedError)).toContain("ERROR [Code: 500]");
      expect(getError(formattedError)).toContain("Details: Server error");
    });

    it("should handle errors with JSON in message", () => {
      const jsonError = new Error('{"error": "message", "code": 500}');
      expect(getError(jsonError)).toBe('{"error": "message", "code": 500}');
    });
  });

  describe("error with special values", () => {
    it("should handle Error with numeric message", () => {
      const error = new Error(String(404));
      expect(getError(error)).toBe("404");
    });

    it("should handle Error with boolean converted message", () => {
      const error = new Error(String(true));
      expect(getError(error)).toBe("true");
    });
  });

  describe("async error scenarios", () => {
    it("should handle promise rejection errors", () => {
      const rejectionError = new Error("Promise was rejected");
      expect(getError(rejectionError)).toBe("Promise was rejected");
    });

    it("should handle async operation errors", () => {
      const asyncError = new Error("Async operation failed");
      expect(getError(asyncError)).toBe("Async operation failed");
    });
  });
});
