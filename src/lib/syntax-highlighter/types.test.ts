import { describe, expect, it } from "vitest";
import type { HighlightRequest, HighlightResponse } from "./types";

describe("syntax-highlighter types", () => {
  describe("HighlightRequest", () => {
    it("should accept valid HighlightRequest with dark theme", () => {
      const request: HighlightRequest = {
        id: "test-123",
        code: "console.log('hello');",
        language: "javascript",
        theme: "dark-plus",
      };

      expect(request.id).toBe("test-123");
      expect(request.code).toBe("console.log('hello');");
      expect(request.language).toBe("javascript");
      expect(request.theme).toBe("dark-plus");
    });

    it("should accept valid HighlightRequest with light theme", () => {
      const request: HighlightRequest = {
        id: "test-456",
        code: "const x = 42;",
        language: "typescript",
        theme: "light-plus",
      };

      expect(request.theme).toBe("light-plus");
    });

    it("should handle empty code", () => {
      const request: HighlightRequest = {
        id: "empty",
        code: "",
        language: "javascript",
        theme: "dark-plus",
      };

      expect(request.code).toBe("");
    });

    it("should handle multiline code", () => {
      const code = `function test() {
  return 42;
}`;
      const request: HighlightRequest = {
        id: "multiline",
        code,
        language: "javascript",
        theme: "dark-plus",
      };

      expect(request.code).toContain("\n");
    });

    it("should handle various programming languages", () => {
      const languages = [
        "javascript",
        "typescript",
        "python",
        "rust",
        "go",
        "java",
      ];

      languages.forEach((lang) => {
        const request: HighlightRequest = {
          id: `test-${lang}`,
          code: "code",
          language: lang,
          theme: "dark-plus",
        };

        expect(request.language).toBe(lang);
      });
    });

    it("should handle UUID-style IDs", () => {
      const request: HighlightRequest = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        code: "code",
        language: "javascript",
        theme: "dark-plus",
      };

      expect(request.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
    });

    it("should handle special characters in code", () => {
      const request: HighlightRequest = {
        id: "special",
        code: "const str = 'hello \"world\"';",
        language: "javascript",
        theme: "dark-plus",
      };

      expect(request.code).toContain('"');
    });
  });

  describe("HighlightResponse", () => {
    it("should accept successful response with HTML", () => {
      const response: HighlightResponse = {
        id: "test-123",
        html: "<span class='keyword'>const</span>",
      };

      expect(response.id).toBe("test-123");
      expect(response.html).toBeDefined();
      expect(response.error).toBeUndefined();
    });

    it("should accept error response", () => {
      const response: HighlightResponse = {
        id: "test-456",
        error: "Language not supported",
      };

      expect(response.id).toBe("test-456");
      expect(response.error).toBeDefined();
      expect(response.html).toBeUndefined();
    });

    it("should accept response with both html and error", () => {
      const response: HighlightResponse = {
        id: "test-789",
        html: "<span>partial</span>",
        error: "Partial highlighting failure",
      };

      expect(response.html).toBeDefined();
      expect(response.error).toBeDefined();
    });

    it("should accept response with neither html nor error", () => {
      const response: HighlightResponse = {
        id: "test-000",
      };

      expect(response.id).toBe("test-000");
      expect(response.html).toBeUndefined();
      expect(response.error).toBeUndefined();
    });

    it("should handle empty HTML string", () => {
      const response: HighlightResponse = {
        id: "empty-html",
        html: "",
      };

      expect(response.html).toBe("");
    });

    it("should handle complex HTML in response", () => {
      const response: HighlightResponse = {
        id: "complex",
        html: '<div class="code"><span class="keyword">function</span> <span class="function">test</span>()</div>',
      };

      expect(response.html).toContain("class=");
      expect(response.html).toContain("keyword");
    });

    it("should handle multiline HTML", () => {
      const html = `<div class="line">
  <span class="keyword">const</span>
</div>`;
      const response: HighlightResponse = {
        id: "multiline-html",
        html,
      };

      expect(response.html).toContain("\n");
    });

    it("should handle various error messages", () => {
      const errors = [
        "Language not supported",
        "Syntax error",
        "Timeout exceeded",
        "Invalid input",
      ];

      errors.forEach((error, index) => {
        const response: HighlightResponse = {
          id: `error-${index}`,
          error,
        };

        expect(response.error).toBe(error);
      });
    });
  });

  describe("type safety", () => {
    it("should enforce theme literal types", () => {
      const darkRequest: HighlightRequest = {
        id: "1",
        code: "code",
        language: "js",
        theme: "dark-plus",
      };

      const lightRequest: HighlightRequest = {
        id: "2",
        code: "code",
        language: "js",
        theme: "light-plus",
      };

      expect(darkRequest.theme).toBe("dark-plus");
      expect(lightRequest.theme).toBe("light-plus");
    });

    it("should handle request/response pairs", () => {
      const request: HighlightRequest = {
        id: "pair-test",
        code: "const x = 1;",
        language: "javascript",
        theme: "dark-plus",
      };

      const response: HighlightResponse = {
        id: request.id,
        html: "<span>const x = 1;</span>",
      };

      expect(response.id).toBe(request.id);
    });
  });
});
