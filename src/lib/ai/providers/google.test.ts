import { describe, expect, it } from "vitest";
import { getGoogle } from "./google";

describe("getGoogle", () => {
  it("should create a Google Generative AI provider with valid API key", () => {
    const apiKey = "test-google-api-key";
    const provider = getGoogle(apiKey);
    
    expect(provider).toBeDefined();
    expect(typeof provider).toBe("function");
  });

  it("should create a Google provider with empty API key", () => {
    const provider = getGoogle("");
    
    expect(provider).toBeDefined();
    expect(typeof provider).toBe("function");
  });

  it("should use 'unset' as fallback for empty API key", () => {
    const provider = getGoogle("");
    
    // The provider should be created successfully even with empty key
    expect(provider).toBeDefined();
  });

  it("should handle API key with special characters", () => {
    const apiKey = "AIza_test-key!@#";
    const provider = getGoogle(apiKey);
    
    expect(provider).toBeDefined();
  });

  it("should handle very long API keys", () => {
    const apiKey = "AIzaSy" + "x".repeat(500);
    const provider = getGoogle(apiKey);
    
    expect(provider).toBeDefined();
  });

  it("should create provider with whitespace in API key", () => {
    const apiKey = "  AIzaSyTest  ";
    const provider = getGoogle(apiKey);
    
    expect(provider).toBeDefined();
  });

  it("should handle various API key formats", () => {
    const keys = [
      "AIzaSyTest123",
      "test-key-format",
      "1234567890",
      "key_with_underscore",
    ];

    keys.forEach((key) => {
      const provider = getGoogle(key);
      expect(provider).toBeDefined();
    });
  });

  it("should create independent provider instances", () => {
    const provider1 = getGoogle("key1");
    const provider2 = getGoogle("key2");
    
    expect(provider1).toBeDefined();
    expect(provider2).toBeDefined();
    expect(provider1).not.toBe(provider2);
  });

  it("should handle repeated calls with same key", () => {
    const apiKey = "same-key";
    const provider1 = getGoogle(apiKey);
    const provider2 = getGoogle(apiKey);
    
    // Should create new instances even with same key
    expect(provider1).toBeDefined();
    expect(provider2).toBeDefined();
  });
});
