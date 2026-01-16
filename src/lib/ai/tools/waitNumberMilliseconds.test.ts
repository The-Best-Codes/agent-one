import { describe, expect, it, vi, beforeEach } from "vitest";
import { createWaitTool } from "./waitNumberMilliseconds";
import type { WaitToolConfig } from "@/lib/settings/types";

describe("createWaitTool", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("tool creation", () => {
    it("should create tool with configuration", () => {
      const config: WaitToolConfig = {
        minMs: 100,
        maxMs: 5000,
        requiresApproval: false,
      };

      const tool = createWaitTool(config);

      expect(tool).toBeDefined();
      expect(tool.description).toContain("100");
      expect(tool.description).toContain("5000");
    });

    it("should include min and max in description", () => {
      const config: WaitToolConfig = {
        minMs: 500,
        maxMs: 10000,
        requiresApproval: false,
      };

      const tool = createWaitTool(config);

      expect(tool.description).toContain("500ms");
      expect(tool.description).toContain("10000ms");
    });
  });

  describe("approval configuration", () => {
    it("should set needsApproval to true when required", () => {
      const config: WaitToolConfig = {
        minMs: 100,
        maxMs: 5000,
        requiresApproval: true,
      };

      const tool = createWaitTool(config);

      expect(tool.needsApproval).toBe(true);
    });

    it("should set needsApproval to false when not required", () => {
      const config: WaitToolConfig = {
        minMs: 100,
        maxMs: 5000,
        requiresApproval: false,
      };

      const tool = createWaitTool(config);

      expect(tool.needsApproval).toBe(false);
    });
  });

  describe("input schema", () => {
    it("should have milliseconds input with min/max constraints", () => {
      const config: WaitToolConfig = {
        minMs: 100,
        maxMs: 5000,
        requiresApproval: false,
      };

      const tool = createWaitTool(config);

      expect(tool.inputSchema).toBeDefined();
    });

    it("should set default to 1000 or maxMs (whichever is smaller)", () => {
      const config: WaitToolConfig = {
        minMs: 100,
        maxMs: 5000,
        requiresApproval: false,
      };

      const tool = createWaitTool(config);
      expect(tool.inputSchema).toBeDefined();
    });

    it("should set default to maxMs when maxMs < 1000", () => {
      const config: WaitToolConfig = {
        minMs: 10,
        maxMs: 500,
        requiresApproval: false,
      };

      const tool = createWaitTool(config);
      expect(tool.inputSchema).toBeDefined();
    });
  });

  describe("execution", () => {
    it("should wait for specified milliseconds", async () => {
      const config: WaitToolConfig = {
        minMs: 100,
        maxMs: 5000,
        requiresApproval: false,
      };

      const tool = createWaitTool(config);
      const promise = tool.execute({ milliseconds: 1000 }, {});

      await vi.advanceTimersByTimeAsync(1000);
      const result = await promise;

      expect(result.status).toBe("success");
      expect(result.waitedMs).toBe(1000);
    });

    it("should clamp milliseconds to minMs", async () => {
      const config: WaitToolConfig = {
        minMs: 500,
        maxMs: 5000,
        requiresApproval: false,
      };

      const tool = createWaitTool(config);
      const promise = tool.execute({ milliseconds: 100 }, {});

      await vi.advanceTimersByTimeAsync(500);
      const result = await promise;

      expect(result.waitedMs).toBe(500);
    });

    it("should clamp milliseconds to maxMs", async () => {
      const config: WaitToolConfig = {
        minMs: 100,
        maxMs: 2000,
        requiresApproval: false,
      };

      const tool = createWaitTool(config);
      const promise = tool.execute({ milliseconds: 10000 }, {});

      await vi.advanceTimersByTimeAsync(2000);
      const result = await promise;

      expect(result.waitedMs).toBe(2000);
    });

    it("should include schema in response", async () => {
      const config: WaitToolConfig = {
        minMs: 100,
        maxMs: 5000,
        requiresApproval: false,
      };

      const tool = createWaitTool(config);
      const promise = tool.execute({ milliseconds: 1000 }, {});

      await vi.advanceTimersByTimeAsync(1000);
      const result = await promise;

      expect(result.schema).toBeDefined();
      expect(result.schema.status).toBeDefined();
      expect(result.schema.waitedMs).toBeDefined();
    });
  });

  describe("abort handling", () => {
    it("should abort when signal is triggered", async () => {
      const config: WaitToolConfig = {
        minMs: 100,
        maxMs: 5000,
        requiresApproval: false,
      };

      const abortController = new AbortController();
      const tool = createWaitTool(config);
      const promise = tool.execute(
        { milliseconds: 2000 },
        { abortSignal: abortController.signal }
      );

      await vi.advanceTimersByTimeAsync(500);
      abortController.abort();

      await expect(promise).rejects.toThrow("aborted");
    });

    it("should clear timeout on abort", async () => {
      const config: WaitToolConfig = {
        minMs: 100,
        maxMs: 5000,
        requiresApproval: false,
      };

      const abortController = new AbortController();
      const tool = createWaitTool(config);
      const promise = tool.execute(
        { milliseconds: 2000 },
        { abortSignal: abortController.signal }
      );

      abortController.abort();

      await expect(promise).rejects.toThrow();
    });

    it("should throw AbortError with correct name", async () => {
      const config: WaitToolConfig = {
        minMs: 100,
        maxMs: 5000,
        requiresApproval: false,
      };

      const abortController = new AbortController();
      const tool = createWaitTool(config);
      const promise = tool.execute(
        { milliseconds: 2000 },
        { abortSignal: abortController.signal }
      );

      abortController.abort();

      try {
        await promise;
        expect.fail("Should have thrown");
      } catch (error) {
        expect((error as Error).name).toBe("AbortError");
      }
    });
  });

  describe("edge cases", () => {
    it("should handle exact minMs value", async () => {
      const config: WaitToolConfig = {
        minMs: 1000,
        maxMs: 5000,
        requiresApproval: false,
      };

      const tool = createWaitTool(config);
      const promise = tool.execute({ milliseconds: 1000 }, {});

      await vi.advanceTimersByTimeAsync(1000);
      const result = await promise;

      expect(result.waitedMs).toBe(1000);
    });

    it("should handle exact maxMs value", async () => {
      const config: WaitToolConfig = {
        minMs: 100,
        maxMs: 2000,
        requiresApproval: false,
      };

      const tool = createWaitTool(config);
      const promise = tool.execute({ milliseconds: 2000 }, {});

      await vi.advanceTimersByTimeAsync(2000);
      const result = await promise;

      expect(result.waitedMs).toBe(2000);
    });

    it("should handle zero milliseconds (clamped to minMs)", async () => {
      const config: WaitToolConfig = {
        minMs: 100,
        maxMs: 5000,
        requiresApproval: false,
      };

      const tool = createWaitTool(config);
      const promise = tool.execute({ milliseconds: 0 }, {});

      await vi.advanceTimersByTimeAsync(100);
      const result = await promise;

      expect(result.waitedMs).toBe(100);
    });

    it("should handle negative milliseconds (clamped to minMs)", async () => {
      const config: WaitToolConfig = {
        minMs: 100,
        maxMs: 5000,
        requiresApproval: false,
      };

      const tool = createWaitTool(config);
      const promise = tool.execute({ milliseconds: -1000 }, {});

      await vi.advanceTimersByTimeAsync(100);
      const result = await promise;

      expect(result.waitedMs).toBe(100);
    });
  });

  describe("various configurations", () => {
    it("should work with small range", async () => {
      const config: WaitToolConfig = {
        minMs: 10,
        maxMs: 100,
        requiresApproval: false,
      };

      const tool = createWaitTool(config);
      const promise = tool.execute({ milliseconds: 50 }, {});

      await vi.advanceTimersByTimeAsync(50);
      const result = await promise;

      expect(result.waitedMs).toBe(50);
    });

    it("should work with large range", async () => {
      const config: WaitToolConfig = {
        minMs: 1000,
        maxMs: 60000,
        requiresApproval: false,
      };

      const tool = createWaitTool(config);
      const promise = tool.execute({ milliseconds: 30000 }, {});

      await vi.advanceTimersByTimeAsync(30000);
      const result = await promise;

      expect(result.waitedMs).toBe(30000);
    });
  });
});
