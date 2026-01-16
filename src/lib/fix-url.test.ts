import { describe, expect, it } from "vitest";
import { fixUrl } from "./fix-url";

describe("fixUrl", () => {
  it("should not modify URLs with http protocol", () => {
    expect(fixUrl("http://example.com")).toBe("http://example.com");
    expect(fixUrl("http://example.com/path")).toBe("http://example.com/path");
    expect(fixUrl("http://example.com:8080")).toBe("http://example.com:8080");
  });

  it("should not modify URLs with https protocol", () => {
    expect(fixUrl("https://example.com")).toBe("https://example.com");
    expect(fixUrl("https://example.com/path")).toBe(
      "https://example.com/path",
    );
    expect(fixUrl("https://example.com:443")).toBe("https://example.com:443");
  });

  it("should add https:// to URLs without protocol", () => {
    expect(fixUrl("example.com")).toBe("https://example.com");
    expect(fixUrl("www.example.com")).toBe("https://www.example.com");
    expect(fixUrl("example.com/path")).toBe("https://example.com/path");
  });

  it("should remove leading slashes and add https://", () => {
    expect(fixUrl("/example.com")).toBe("https://example.com");
    expect(fixUrl("//example.com")).toBe("https://example.com");
    expect(fixUrl("///example.com")).toBe("https://example.com");
  });

  it("should remove leading colons and add https://", () => {
    expect(fixUrl(":example.com")).toBe("https://example.com");
    expect(fixUrl("::example.com")).toBe("https://example.com");
  });

  it("should handle mixed leading slashes and colons", () => {
    expect(fixUrl("/:example.com")).toBe("https://example.com");
    expect(fixUrl(":/example.com")).toBe("https://example.com");
    expect(fixUrl("/:/example.com")).toBe("https://example.com");
  });

  it("should trim whitespace before processing", () => {
    expect(fixUrl("  example.com  ")).toBe("https://example.com");
    expect(fixUrl("\nexample.com\n")).toBe("https://example.com");
    expect(fixUrl("\texample.com\t")).toBe("https://example.com");
  });

  it("should handle URLs with query parameters", () => {
    expect(fixUrl("example.com?param=value")).toBe(
      "https://example.com?param=value",
    );
    expect(fixUrl("https://example.com?param=value")).toBe(
      "https://example.com?param=value",
    );
  });

  it("should handle URLs with fragments", () => {
    expect(fixUrl("example.com#section")).toBe("https://example.com#section");
    expect(fixUrl("https://example.com#section")).toBe(
      "https://example.com#section",
    );
  });

  it("should handle subdomains", () => {
    expect(fixUrl("sub.example.com")).toBe("https://sub.example.com");
    expect(fixUrl("deep.sub.example.com")).toBe("https://deep.sub.example.com");
  });

  it("should handle localhost", () => {
    expect(fixUrl("localhost")).toBe("https://localhost");
    expect(fixUrl("localhost:3000")).toBe("https://localhost:3000");
    expect(fixUrl("http://localhost:3000")).toBe("http://localhost:3000");
  });

  it("should handle IP addresses", () => {
    expect(fixUrl("192.168.1.1")).toBe("https://192.168.1.1");
    expect(fixUrl("127.0.0.1:8080")).toBe("https://127.0.0.1:8080");
  });

  it("should handle empty or invalid URLs gracefully", () => {
    expect(fixUrl("")).toBe("https://");
    expect(fixUrl("   ")).toBe("https://");
  });
});
