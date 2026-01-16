import { describe, expect, it } from "vitest";
import { getError } from "./get-error";

describe("getError", () => {
  it("should extract message from Error instances", () => {
    const error = new Error("Test error message");
    expect(getError(error)).toBe("Test error message");
  });

  it("should return string errors as-is", () => {
    expect(getError("Simple error message")).toBe("Simple error message");
    expect(getError("")).toBe("");
  });

  it("should return 'Unknown error' for undefined", () => {
    expect(getError(undefined)).toBe("Unknown error");
  });

  it("should handle TypeError instances", () => {
    const error = new TypeError("Type error occurred");
    expect(getError(error)).toBe("Type error occurred");
  });

  it("should handle RangeError instances", () => {
    const error = new RangeError("Range error occurred");
    expect(getError(error)).toBe("Range error occurred");
  });

  it("should handle custom Error subclasses", () => {
    class CustomError extends Error {
      constructor(message: string) {
        super(message);
        this.name = "CustomError";
      }
    }
    const error = new CustomError("Custom error message");
    expect(getError(error)).toBe("Custom error message");
  });

  it("should handle empty error messages", () => {
    const error = new Error("");
    expect(getError(error)).toBe("");
  });

  it("should handle errors with special characters", () => {
    const error = new Error("Error with special chars: @#$%^&*()");
    expect(getError(error)).toBe("Error with special chars: @#$%^&*()");
  });

  it("should handle multi-line error messages", () => {
    const error = new Error("Line 1\nLine 2\nLine 3");
    expect(getError(error)).toBe("Line 1\nLine 2\nLine 3");
  });
});
