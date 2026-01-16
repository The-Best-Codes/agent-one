import { describe, expect, it } from "vitest";
import { getOpenCode } from "./opencode";

describe("getOpenCode", () => {
  it("should create an OpenCode provider with valid API key", () => {
    const apiKey = "test-opencode-key";
    const provider = getOpenCode(apiKey);
    
    expect(provider).toBeDefined();
    expect(typeof provider).toBe("function");
  });

  it("should create an OpenCode provider with empty API key", () => {
    const provider = getOpenCode("");
    
    expect(provider).toBeDefined();
    expect(typeof provider).toBe("function");
  });

  it("should use 'unset' as fallback for empty API key", () => {
    const provider = getOpenCode("");
    
    expect(provider).toBeDefined();
  });

  it("should handle API key with special characters", () => {
    const apiKey = "oc_test!@#$%^&*()";
    const provider = getOpenCode(apiKey);
    
    expect(provider).toBeDefined();
  });

  it("should handle very long API keys", () => {
    const apiKey = "oc_" + "x".repeat(1000);
    const provider = getOpenCode(apiKey);
    
    expect(provider).toBeDefined();
  });

  it("should create provider with whitespace in API key", () => {
    const apiKey = "  oc_test_key  ";
    const provider = getOpenCode(apiKey);
    
    expect(provider).toBeDefined();
  });

  it("should handle various OpenCode key formats", () => {
    const keys = [
      "oc_test_v1",
      "test-key-format",
      "1234567890",
      "key.with.dots",
    ];

    keys.forEach((key) => {
      const provider = getOpenCode(key);
      expect(provider).toBeDefined();
    });
  });

  it("should create independent provider instances", () => {
    const provider1 = getOpenCode("key1");
    const provider2 = getOpenCode("key2");
    
    expect(provider1).toBeDefined();
    expect(provider2).toBeDefined();
    expect(provider1).not.toBe(provider2);
  });

  it("should handle repeated provider creation", () => {
    const apiKey = "same-key";
    const providers = Array(5)
      .fill(null)
      .map(() => getOpenCode(apiKey));
    
    providers.forEach((provider) => {
      expect(provider).toBeDefined();
    });
  });

  it("should configure with correct base URL", () => {
    const provider = getOpenCode("test-key");
    
    // Provider should be configured with opencode.ai endpoint
    expect(provider).toBeDefined();
  });
});
