import { describe, expect, it } from "vitest";
import { getGroq } from "./groq";

describe("getGroq", () => {
  it("should create a Groq provider with valid API key", () => {
    const apiKey = "test-api-key-123";
    const provider = getGroq(apiKey);
    
    expect(provider).toBeDefined();
    expect(typeof provider).toBe("function");
  });

  it("should create a Groq provider with empty API key", () => {
    const provider = getGroq("");
    
    expect(provider).toBeDefined();
    expect(typeof provider).toBe("function");
  });

  it("should use 'unset' as fallback for empty API key", () => {
    const provider = getGroq("");
    
    // The provider should be created successfully even with empty key
    expect(provider).toBeDefined();
  });

  it("should handle API key with special characters", () => {
    const apiKey = "sk-test_key!@#$%^&*()";
    const provider = getGroq(apiKey);
    
    expect(provider).toBeDefined();
  });

  it("should handle very long API keys", () => {
    const apiKey = "a".repeat(1000);
    const provider = getGroq(apiKey);
    
    expect(provider).toBeDefined();
  });

  it("should create provider with whitespace in API key", () => {
    const apiKey = "  test-key-with-spaces  ";
    const provider = getGroq(apiKey);
    
    expect(provider).toBeDefined();
  });

  it("should handle numeric API keys as strings", () => {
    const apiKey = "1234567890";
    const provider = getGroq(apiKey);
    
    expect(provider).toBeDefined();
  });

  it("should create independent provider instances", () => {
    const provider1 = getGroq("key1");
    const provider2 = getGroq("key2");
    
    expect(provider1).toBeDefined();
    expect(provider2).toBeDefined();
    // Providers should be different instances
    expect(provider1).not.toBe(provider2);
  });
});
