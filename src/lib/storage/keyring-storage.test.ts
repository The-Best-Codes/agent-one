import { describe, expect, it, vi, beforeEach } from "vitest";
import { keyringStorage } from "./keyring-storage";

// Mock Tauri API
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  getLogger: vi.fn(() => ({
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

import { invoke } from "@tauri-apps/api/core";

describe("keyringStorage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getItem", () => {
    it("should return parsed value when successful", async () => {
      const mockValue = { test: "data" };
      vi.mocked(invoke).mockResolvedValue({
        value: JSON.stringify(mockValue),
        error: null,
      });

      const result = await keyringStorage.getItem("test-key", {});

      expect(result).toEqual(mockValue);
      expect(invoke).toHaveBeenCalledWith("storage_get_item", {
        key: "test-key",
        defaultJson: "{}",
      });
    });

    it("should return initial value when response has error", async () => {
      const initialValue = { default: true };
      vi.mocked(invoke).mockResolvedValue({
        value: null,
        error: "Storage error",
      });

      const result = await keyringStorage.getItem("test-key", initialValue);

      expect(result).toEqual(initialValue);
    });

    it("should return initial value when response value is null", async () => {
      const initialValue = { default: true };
      vi.mocked(invoke).mockResolvedValue({
        value: null,
        error: null,
      });

      const result = await keyringStorage.getItem("test-key", initialValue);

      expect(result).toEqual(initialValue);
    });

    it("should return initial value on invoke error", async () => {
      const initialValue = { default: true };
      vi.mocked(invoke).mockRejectedValue(new Error("Invoke failed"));

      const result = await keyringStorage.getItem("test-key", initialValue);

      expect(result).toEqual(initialValue);
    });

    it("should handle string values", async () => {
      vi.mocked(invoke).mockResolvedValue({
        value: JSON.stringify("test string"),
        error: null,
      });

      const result = await keyringStorage.getItem("key", "default");

      expect(result).toBe("test string");
    });

    it("should handle number values", async () => {
      vi.mocked(invoke).mockResolvedValue({
        value: JSON.stringify(42),
        error: null,
      });

      const result = await keyringStorage.getItem("key", 0);

      expect(result).toBe(42);
    });

    it("should handle boolean values", async () => {
      vi.mocked(invoke).mockResolvedValue({
        value: JSON.stringify(true),
        error: null,
      });

      const result = await keyringStorage.getItem("key", false);

      expect(result).toBe(true);
    });

    it("should handle array values", async () => {
      const array = [1, 2, 3];
      vi.mocked(invoke).mockResolvedValue({
        value: JSON.stringify(array),
        error: null,
      });

      const result = await keyringStorage.getItem("key", []);

      expect(result).toEqual(array);
    });

    it("should handle nested objects", async () => {
      const nested = { a: { b: { c: "deep" } } };
      vi.mocked(invoke).mockResolvedValue({
        value: JSON.stringify(nested),
        error: null,
      });

      const result = await keyringStorage.getItem("key", {});

      expect(result).toEqual(nested);
    });
  });

  describe("setItem", () => {
    it("should set item successfully", async () => {
      vi.mocked(invoke).mockResolvedValue(undefined);
      const value = { test: "data" };

      await keyringStorage.setItem("test-key", value);

      expect(invoke).toHaveBeenCalledWith("storage_set_item", {
        key: "test-key",
        valueJson: JSON.stringify(value),
      });
    });

    it("should handle invoke error gracefully", async () => {
      vi.mocked(invoke).mockRejectedValue(new Error("Set failed"));

      await expect(
        keyringStorage.setItem("test-key", { test: "data" })
      ).resolves.not.toThrow();
    });

    it("should stringify string values", async () => {
      vi.mocked(invoke).mockResolvedValue(undefined);

      await keyringStorage.setItem("key", "value");

      expect(invoke).toHaveBeenCalledWith("storage_set_item", {
        key: "key",
        valueJson: '"value"',
      });
    });

    it("should stringify number values", async () => {
      vi.mocked(invoke).mockResolvedValue(undefined);

      await keyringStorage.setItem("key", 123);

      expect(invoke).toHaveBeenCalledWith("storage_set_item", {
        key: "key",
        valueJson: "123",
      });
    });

    it("should stringify boolean values", async () => {
      vi.mocked(invoke).mockResolvedValue(undefined);

      await keyringStorage.setItem("key", false);

      expect(invoke).toHaveBeenCalledWith("storage_set_item", {
        key: "key",
        valueJson: "false",
      });
    });

    it("should stringify arrays", async () => {
      vi.mocked(invoke).mockResolvedValue(undefined);
      const array = [1, 2, 3];

      await keyringStorage.setItem("key", array);

      expect(invoke).toHaveBeenCalledWith("storage_set_item", {
        key: "key",
        valueJson: JSON.stringify(array),
      });
    });
  });

  describe("removeItem", () => {
    it("should remove item successfully", async () => {
      vi.mocked(invoke).mockResolvedValue(undefined);

      await keyringStorage.removeItem("test-key");

      expect(invoke).toHaveBeenCalledWith("storage_remove_item", {
        key: "test-key",
      });
    });

    it("should handle invoke error gracefully", async () => {
      vi.mocked(invoke).mockRejectedValue(new Error("Remove failed"));

      await expect(
        keyringStorage.removeItem("test-key")
      ).resolves.not.toThrow();
    });

    it("should remove with different key names", async () => {
      vi.mocked(invoke).mockResolvedValue(undefined);

      await keyringStorage.removeItem("different-key");

      expect(invoke).toHaveBeenCalledWith("storage_remove_item", {
        key: "different-key",
      });
    });
  });

  describe("hasItem", () => {
    it("should return true when item exists", async () => {
      vi.mocked(invoke).mockResolvedValue(true);

      const result = await keyringStorage.hasItem("test-key");

      expect(result).toBe(true);
      expect(invoke).toHaveBeenCalledWith("storage_has_item", {
        key: "test-key",
      });
    });

    it("should return false when item does not exist", async () => {
      vi.mocked(invoke).mockResolvedValue(false);

      const result = await keyringStorage.hasItem("test-key");

      expect(result).toBe(false);
    });

    it("should return false on invoke error", async () => {
      vi.mocked(invoke).mockRejectedValue(new Error("Has failed"));

      const result = await keyringStorage.hasItem("test-key");

      expect(result).toBe(false);
    });

    it("should check different keys", async () => {
      vi.mocked(invoke).mockResolvedValue(true);

      await keyringStorage.hasItem("another-key");

      expect(invoke).toHaveBeenCalledWith("storage_has_item", {
        key: "another-key",
      });
    });
  });

  describe("edge cases", () => {
    it("should handle empty string keys", async () => {
      vi.mocked(invoke).mockResolvedValue({
        value: '{"test":"data"}',
        error: null,
      });

      const result = await keyringStorage.getItem("", {});

      expect(invoke).toHaveBeenCalledWith("storage_get_item", {
        key: "",
        defaultJson: "{}",
      });
    });

    it("should handle keys with special characters", async () => {
      vi.mocked(invoke).mockResolvedValue({
        value: "null",
        error: null,
      });

      await keyringStorage.getItem("key-with-dashes_and_underscores", null);
      expect(invoke).toHaveBeenCalled();
    });

    it("should handle null initial values", async () => {
      vi.mocked(invoke).mockResolvedValue({
        value: null,
        error: null,
      });

      const result = await keyringStorage.getItem("key", null);

      expect(result).toBe(null);
    });

    it("should handle undefined in objects", async () => {
      const obj = { a: undefined };
      vi.mocked(invoke).mockResolvedValue(undefined);

      await keyringStorage.setItem("key", obj);

      expect(invoke).toHaveBeenCalled();
    });
  });
});
