import { describe, expect, it, vi, beforeEach } from "vitest";
import { createDateTimeTool } from "./dateTime";
import type { DateTimeToolConfig } from "@/lib/settings/types";

describe("createDateTimeTool", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-15T12:30:45.123Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("UTC mode", () => {
    it("should create tool with UTC configuration", () => {
      const config: DateTimeToolConfig = {
        useUtc: true,
        requiresApproval: false,
      };

      const tool = createDateTimeTool(config);

      expect(tool).toBeDefined();
      expect(tool.description).toContain("UTC");
    });

    it("should return UTC time when executed", async () => {
      const config: DateTimeToolConfig = {
        useUtc: true,
        requiresApproval: false,
      };

      const tool = createDateTimeTool(config);
      const result = await tool.execute({}, {});

      expect(result.timezone).toBe("UTC");
      expect(result.dateTime).toBe("2024-01-15T12:30:45.123Z");
      expect(result.formatted).toContain("2024");
    });

    it("should include schema in response", async () => {
      const config: DateTimeToolConfig = {
        useUtc: true,
        requiresApproval: false,
      };

      const tool = createDateTimeTool(config);
      const result = await tool.execute({}, {});

      expect(result.schema).toBeDefined();
      expect(result.schema.dateTime).toContain("ISO 8601");
      expect(result.schema.timezone).toContain("UTC");
    });
  });

  describe("Local timezone mode", () => {
    it("should create tool with local timezone configuration", () => {
      const config: DateTimeToolConfig = {
        useUtc: false,
        requiresApproval: false,
      };

      const tool = createDateTimeTool(config);

      expect(tool).toBeDefined();
      expect(tool.description).toContain("local timezone");
    });

    it("should return local time when executed", async () => {
      const config: DateTimeToolConfig = {
        useUtc: false,
        requiresApproval: false,
      };

      const tool = createDateTimeTool(config);
      const result = await tool.execute({}, {});

      expect(result.dateTime).toBe("2024-01-15T12:30:45.123Z");
      expect(result.timezone).toBeDefined();
      expect(typeof result.timezone).toBe("string");
    });

    it("should include schema in response", async () => {
      const config: DateTimeToolConfig = {
        useUtc: false,
        requiresApproval: false,
      };

      const tool = createDateTimeTool(config);
      const result = await tool.execute({}, {});

      expect(result.schema).toBeDefined();
      expect(result.schema.dateTime).toContain("ISO 8601");
      expect(result.schema.timezone).toContain("local timezone");
    });
  });

  describe("approval configuration", () => {
    it("should set needsApproval to true when required", () => {
      const config: DateTimeToolConfig = {
        useUtc: true,
        requiresApproval: true,
      };

      const tool = createDateTimeTool(config);

      expect(tool.needsApproval).toBe(true);
    });

    it("should set needsApproval to false when not required", () => {
      const config: DateTimeToolConfig = {
        useUtc: false,
        requiresApproval: false,
      };

      const tool = createDateTimeTool(config);

      expect(tool.needsApproval).toBe(false);
    });
  });

  describe("input schema", () => {
    it("should have empty input schema", () => {
      const config: DateTimeToolConfig = {
        useUtc: true,
        requiresApproval: false,
      };

      const tool = createDateTimeTool(config);

      expect(tool.inputSchema).toBeDefined();
    });
  });

  describe("execution with abort signal", () => {
    it("should execute successfully with abort signal", async () => {
      const config: DateTimeToolConfig = {
        useUtc: true,
        requiresApproval: false,
      };

      const abortController = new AbortController();
      const tool = createDateTimeTool(config);
      const result = await tool.execute({}, { abortSignal: abortController.signal });

      expect(result).toBeDefined();
      expect(result.dateTime).toBeDefined();
    });
  });

  describe("different configurations", () => {
    it("should handle UTC true with approval true", async () => {
      const config: DateTimeToolConfig = {
        useUtc: true,
        requiresApproval: true,
      };

      const tool = createDateTimeTool(config);
      const result = await tool.execute({}, {});

      expect(result.timezone).toBe("UTC");
      expect(tool.needsApproval).toBe(true);
    });

    it("should handle UTC false with approval true", async () => {
      const config: DateTimeToolConfig = {
        useUtc: false,
        requiresApproval: true,
      };

      const tool = createDateTimeTool(config);
      const result = await tool.execute({}, {});

      expect(result.timezone).toBeDefined();
      expect(typeof result.timezone).toBe("string");
      expect(tool.needsApproval).toBe(true);
    });
  });

  describe("date formatting", () => {
    it("should format ISO string correctly in UTC mode", async () => {
      const config: DateTimeToolConfig = {
        useUtc: true,
        requiresApproval: false,
      };

      const tool = createDateTimeTool(config);
      const result = await tool.execute({}, {});

      expect(result.dateTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it("should format ISO string correctly in local mode", async () => {
      const config: DateTimeToolConfig = {
        useUtc: false,
        requiresApproval: false,
      };

      const tool = createDateTimeTool(config);
      const result = await tool.execute({}, {});

      expect(result.dateTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });
});
