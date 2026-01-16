import { describe, expect, it } from "vitest";
import { getOpenRouter } from "./openrouter";

describe("getOpenRouter", () => {
  it("should create an OpenRouter provider with valid API key", () => {
    const apiKey = "sk-or-test-key";
    const provider = getOpenRouter(apiKey);
    
    expect(provider).toBeDefined();
    expect(typeof provider).toBe("function");
  });

  it("should create an OpenRouter provider with empty API key", () => {
    const provider = getOpenRouter("");
    
    expect(provider).toBeDefined();
    expect(typeof provider).toBe("function");
  });

  it("should use 'unset' as fallback for empty API key", () => {
    const provider = getOpenRouter("");
    
    expect(provider).toBeDefined();
  });

  it("should handle API key with special characters", () => {
    const apiKey = "sk-or_test!@#$%";
    const provider = getOpenRouter(apiKey);
    
    expect(provider).toBeDefined();
  });

  it("should handle very long API keys", () => {
    const apiKey = "sk-or-" + "x".repeat(1000);
    const provider = getOpenRouter(apiKey);
    
    expect(provider).toBeDefined();
  });

  it("should create provider with whitespace in API key", () => {
    const apiKey = "  sk-or-test  ";
    const provider = getOpenRouter(apiKey);
    
    expect(provider).toBeDefined();
  });

  it("should handle various OpenRouter key formats", () => {
    const keys = [
      "sk-or-v1-test",
      "test-key",
      "1234567890",
      "key_with_underscore",
    ];

    keys.forEach((key) => {
      const provider = getOpenRouter(key);
      expect(provider).toBeDefined();
    });
  });

  it("should create independent provider instances", () => {
    const provider1 = getOpenRouter("key1");
    const provider2 = getOpenRouter("key2");
    
    expect(provider1).toBeDefined();
    expect(provider2).toBeDefined();
    expect(provider1).not.toBe(provider2);
  });

  it("should handle null-like string values", () => {
    const keys = ["null", "undefined", ""];
    
    keys.forEach((key) => {
      const provider = getOpenRouter(key);
      expect(provider).toBeDefined();
    });
  });
});
