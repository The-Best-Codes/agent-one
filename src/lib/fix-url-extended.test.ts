import { describe, expect, it } from "vitest";
import { fixUrl } from "@/lib/fix-url";

describe("fixUrl - Additional Edge Cases", () => {
  describe("protocol handling", () => {
    it("should preserve http protocol", () => {
      expect(fixUrl("http://example.com")).toBe("http://example.com");
      expect(fixUrl("http://localhost")).toBe("http://localhost");
      expect(fixUrl("http://192.168.1.1")).toBe("http://192.168.1.1");
    });

    it("should preserve https protocol", () => {
      expect(fixUrl("https://example.com")).toBe("https://example.com");
      expect(fixUrl("https://secure.example.com")).toBe(
        "https://secure.example.com",
      );
    });

    it("should not add protocol to other valid protocols", () => {
      // These should be left as-is since they start with http:// or https://
      expect(fixUrl("http://ftp.example.com")).toBe("http://ftp.example.com");
      expect(fixUrl("https://ws.example.com")).toBe("https://ws.example.com");
    });
  });

  describe("whitespace handling", () => {
    it("should trim leading whitespace", () => {
      expect(fixUrl(" example.com")).toBe("https://example.com");
      expect(fixUrl("  example.com")).toBe("https://example.com");
      expect(fixUrl("\texample.com")).toBe("https://example.com");
    });

    it("should trim trailing whitespace", () => {
      expect(fixUrl("example.com ")).toBe("https://example.com");
      expect(fixUrl("example.com  ")).toBe("https://example.com");
      expect(fixUrl("example.com\t")).toBe("https://example.com");
    });

    it("should trim both leading and trailing whitespace", () => {
      expect(fixUrl(" example.com ")).toBe("https://example.com");
      expect(fixUrl("\t example.com \t")).toBe("https://example.com");
      expect(fixUrl("\n example.com \n")).toBe("https://example.com");
    });
  });

  describe("slash and colon removal", () => {
    it("should remove single leading slash", () => {
      expect(fixUrl("/example.com")).toBe("https://example.com");
    });

    it("should remove multiple leading slashes", () => {
      expect(fixUrl("//example.com")).toBe("https://example.com");
      expect(fixUrl("///example.com")).toBe("https://example.com");
      expect(fixUrl("////example.com")).toBe("https://example.com");
    });

    it("should remove single leading colon", () => {
      expect(fixUrl(":example.com")).toBe("https://example.com");
    });

    it("should remove multiple leading colons", () => {
      expect(fixUrl("::example.com")).toBe("https://example.com");
      expect(fixUrl(":::example.com")).toBe("https://example.com");
    });

    it("should remove mixed slashes and colons", () => {
      expect(fixUrl("/:example.com")).toBe("https://example.com");
      expect(fixUrl(":/example.com")).toBe("https://example.com");
      expect(fixUrl("/:/example.com")).toBe("https://example.com");
      expect(fixUrl("://example.com")).toBe("https://example.com");
    });
  });

  describe("domain variations", () => {
    it("should handle subdomains", () => {
      expect(fixUrl("www.example.com")).toBe("https://www.example.com");
      expect(fixUrl("api.example.com")).toBe("https://api.example.com");
      expect(fixUrl("sub.domain.example.com")).toBe(
        "https://sub.domain.example.com",
      );
    });

    it("should handle different TLDs", () => {
      expect(fixUrl("example.org")).toBe("https://example.org");
      expect(fixUrl("example.net")).toBe("https://example.net");
      expect(fixUrl("example.io")).toBe("https://example.io");
      expect(fixUrl("example.co.uk")).toBe("https://example.co.uk");
    });

    it("should handle internationalized domains", () => {
      expect(fixUrl("münchen.de")).toBe("https://münchen.de");
      expect(fixUrl("例え.jp")).toBe("https://例え.jp");
    });
  });

  describe("port numbers", () => {
    it("should preserve port numbers without protocol", () => {
      expect(fixUrl("example.com:8080")).toBe("https://example.com:8080");
      expect(fixUrl("localhost:3000")).toBe("https://localhost:3000");
    });

    it("should preserve port numbers with protocol", () => {
      expect(fixUrl("http://example.com:8080")).toBe("http://example.com:8080");
      expect(fixUrl("https://example.com:443")).toBe("https://example.com:443");
    });

    it("should handle non-standard ports", () => {
      expect(fixUrl("example.com:9999")).toBe("https://example.com:9999");
      expect(fixUrl("localhost:1337")).toBe("https://localhost:1337");
    });
  });

  describe("path handling", () => {
    it("should preserve paths without protocol", () => {
      expect(fixUrl("example.com/path")).toBe("https://example.com/path");
      expect(fixUrl("example.com/path/to/page")).toBe(
        "https://example.com/path/to/page",
      );
    });

    it("should preserve paths with protocol", () => {
      expect(fixUrl("https://example.com/path")).toBe(
        "https://example.com/path",
      );
      expect(fixUrl("http://example.com/path/page")).toBe(
        "http://example.com/path/page",
      );
    });

    it("should preserve trailing slashes in paths", () => {
      expect(fixUrl("example.com/path/")).toBe("https://example.com/path/");
      expect(fixUrl("https://example.com/")).toBe("https://example.com/");
    });
  });

  describe("query parameters", () => {
    it("should preserve query parameters without protocol", () => {
      expect(fixUrl("example.com?query=value")).toBe(
        "https://example.com?query=value",
      );
      expect(fixUrl("example.com?q=1&p=2")).toBe("https://example.com?q=1&p=2");
    });

    it("should preserve query parameters with protocol", () => {
      expect(fixUrl("https://example.com?query=value")).toBe(
        "https://example.com?query=value",
      );
    });

    it("should preserve complex query strings", () => {
      expect(fixUrl("example.com?a=1&b=2&c=3")).toBe(
        "https://example.com?a=1&b=2&c=3",
      );
      expect(fixUrl("example.com?search=test%20query")).toBe(
        "https://example.com?search=test%20query",
      );
    });
  });

  describe("fragments/anchors", () => {
    it("should preserve fragments without protocol", () => {
      expect(fixUrl("example.com#section")).toBe("https://example.com#section");
      expect(fixUrl("example.com#top")).toBe("https://example.com#top");
    });

    it("should preserve fragments with protocol", () => {
      expect(fixUrl("https://example.com#section")).toBe(
        "https://example.com#section",
      );
    });

    it("should preserve fragments with paths and queries", () => {
      expect(fixUrl("example.com/page?q=1#section")).toBe(
        "https://example.com/page?q=1#section",
      );
    });
  });

  describe("IP addresses", () => {
    it("should handle IPv4 addresses", () => {
      expect(fixUrl("192.168.1.1")).toBe("https://192.168.1.1");
      expect(fixUrl("10.0.0.1")).toBe("https://10.0.0.1");
      expect(fixUrl("127.0.0.1")).toBe("https://127.0.0.1");
    });

    it("should handle IPv4 with ports", () => {
      expect(fixUrl("192.168.1.1:8080")).toBe("https://192.168.1.1:8080");
      expect(fixUrl("127.0.0.1:3000")).toBe("https://127.0.0.1:3000");
    });

    it("should preserve IPv4 with protocol", () => {
      expect(fixUrl("http://192.168.1.1")).toBe("http://192.168.1.1");
      expect(fixUrl("https://192.168.1.1")).toBe("https://192.168.1.1");
    });
  });

  describe("localhost variations", () => {
    it("should handle localhost", () => {
      expect(fixUrl("localhost")).toBe("https://localhost");
    });

    it("should handle localhost with port", () => {
      expect(fixUrl("localhost:3000")).toBe("https://localhost:3000");
      expect(fixUrl("localhost:8080")).toBe("https://localhost:8080");
    });

    it("should preserve localhost with protocol", () => {
      expect(fixUrl("http://localhost")).toBe("http://localhost");
      expect(fixUrl("http://localhost:3000")).toBe("http://localhost:3000");
    });
  });

  describe("edge cases and special scenarios", () => {
    it("should handle URLs with @ symbol", () => {
      expect(fixUrl("user@example.com")).toBe("https://user@example.com");
    });

    it("should handle very long domains", () => {
      const longDomain = "very.long.subdomain.example.com";
      expect(fixUrl(longDomain)).toBe(`https://${longDomain}`);
    });

    it("should handle domains with dashes and underscores", () => {
      expect(fixUrl("my-domain.com")).toBe("https://my-domain.com");
      expect(fixUrl("my_domain.com")).toBe("https://my_domain.com");
    });

    it("should handle domains with numbers", () => {
      expect(fixUrl("example123.com")).toBe("https://example123.com");
      expect(fixUrl("123example.com")).toBe("https://123example.com");
    });

    it("should handle single word domains (might be invalid but should process)", () => {
      expect(fixUrl("localhost")).toBe("https://localhost");
      expect(fixUrl("example")).toBe("https://example");
    });
  });

  describe("malformed or unusual inputs", () => {
    it("should handle double protocols", () => {
      expect(fixUrl("https://https://example.com")).toBe(
        "https://https://example.com",
      );
    });

    it("should handle URLs with spaces (after trim)", () => {
      expect(fixUrl("example.com/path with spaces")).toBe(
        "https://example.com/path with spaces",
      );
    });

    it("should handle empty or whitespace-only strings", () => {
      expect(fixUrl("")).toBe("https://");
      expect(fixUrl("   ")).toBe("https://");
      expect(fixUrl("\t\n")).toBe("https://");
    });
  });
});
