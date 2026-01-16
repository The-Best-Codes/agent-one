import { describe, expect, it } from "vitest";
import {
  createDateTimeTool,
  createGetUrlContentTool,
  createWaitTool,
  createWebSearchTool,
} from "./index";

describe("AI tools index exports", () => {
  describe("exports", () => {
    it("should export createDateTimeTool", () => {
      expect(createDateTimeTool).toBeDefined();
      expect(typeof createDateTimeTool).toBe("function");
    });

    it("should export createGetUrlContentTool", () => {
      expect(createGetUrlContentTool).toBeDefined();
      expect(typeof createGetUrlContentTool).toBe("function");
    });

    it("should export createWaitTool", () => {
      expect(createWaitTool).toBeDefined();
      expect(typeof createWaitTool).toBe("function");
    });

    it("should export createWebSearchTool", () => {
      expect(createWebSearchTool).toBeDefined();
      expect(typeof createWebSearchTool).toBe("function");
    });
  });

  describe("function signatures", () => {
    it("should have correct function names", () => {
      expect(createDateTimeTool.name).toBe("createDateTimeTool");
      expect(createWaitTool.name).toBe("createWaitTool");
    });
  });
});
