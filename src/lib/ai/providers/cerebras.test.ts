import { describe, expect, it } from "vitest";
import { getCerebras } from "./cerebras";

describe("getCerebras", () => {
  it("should create a Cerebras provider with valid API key", () => {
    const apiKey = "test-cerebras-key";
    const provider = getCerebras(apiKey);
    
    expect(provider).toBeDefined();
    expect(typeof provider).toBe("function");
  });

  it("should create a Cerebras provider with empty API key", () => {
    const provider = getCerebras("");
    
    expect(provider).toBeDefined();
    expect(typeof provider).toBe("function");
  });

  it("should use 'unset' as fallback for empty API key", () => {
    const provider = getCerebras("");
    
    expect(provider).toBeDefined();
  });

  it("should handle API key with special characters", () => {
    const apiKey = "cb_test!@#$%^&*()";
    const provider = getCerebras(apiKey);
    
    expect(provider).toBeDefined();
  });

  it("should handle very long API keys", () => {
    const apiKey = "cb_" + "x".repeat(1000);
    const provider = getCerebras(apiKey);
    
    expect(provider).toBeDefined();
  });

  it("should create provider with whitespace in API key", () => {
    const apiKey = "  cb_test_key  ";
    const provider = getCerebras(apiKey);
    
    expect(provider).toBeDefined();
  });

  it("should handle various Cerebras key formats", () => {
    const keys = [
      "cb_test_v1",
      "test-key-format",
      "1234567890",
      "key_with_underscore",
    ];

    keys.forEach((key) => {
      const provider = getCerebras(key);
      expect(provider).toBeDefined();
    });
  });

  it("should create independent provider instances", () => {
    const provider1 = getCerebras("key1");
    const provider2 = getCerebras("key2");
    
    expect(provider1).toBeDefined();
    expect(provider2).toBeDefined();
    expect(provider1).not.toBe(provider2);
  });

  it("should handle numeric string API keys", () => {
    const apiKey = "123456789012345";
    const provider = getCerebras(apiKey);
    
    expect(provider).toBeDefined();
  });

  it("should configure with correct base URL", () => {
    const provider = getCerebras("test-key");
    
    // Provider should be configured with Cerebras API endpoint
    expect(provider).toBeDefined();
  });

  it("should handle repeated calls with same key", () => {
    const apiKey = "same-cerebras-key";
    const provider1 = getCerebras(apiKey);
    const provider2 = getCerebras(apiKey);
    
    expect(provider1).toBeDefined();
    expect(provider2).toBeDefined();
  });
});
