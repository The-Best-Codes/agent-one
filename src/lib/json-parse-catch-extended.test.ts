import { describe, expect, it } from "vitest";
import { jsonParseCatch } from "@/lib/json-parse-catch";

describe("jsonParseCatch - Extended Edge Cases", () => {
  describe("complex nested structures", () => {
    it("should parse deeply nested objects", () => {
      const deepNest = JSON.stringify({
        a: { b: { c: { d: { e: { f: "value" } } } } },
      });
      const result = jsonParseCatch(deepNest);
      expect(result).toEqual({
        a: { b: { c: { d: { e: { f: "value" } } } } },
      });
    });

    it("should parse deeply nested arrays", () => {
      const deepArray = JSON.stringify([[[[[["nested"]]]]]]);
      const result = jsonParseCatch(deepArray);
      expect(result).toEqual([[[[[["nested"]]]]]]);
    });

    it("should parse mixed nested structures", () => {
      const mixed = JSON.stringify({
        arr: [1, { obj: { val: [2, 3] } }],
        obj: { arr: [{ nested: true }] },
      });
      const result = jsonParseCatch(mixed);
      expect(result).toEqual({
        arr: [1, { obj: { val: [2, 3] } }],
        obj: { arr: [{ nested: true }] },
      });
    });
  });

  describe("special JSON values", () => {
    it("should parse JSON with special numbers", () => {
      expect(jsonParseCatch("0")).toBe(0);
      expect(jsonParseCatch("-0")).toBe(-0);
      expect(jsonParseCatch("1e10")).toBe(1e10);
      expect(jsonParseCatch("1.5e-10")).toBe(1.5e-10);
    });

    it("should parse empty structures", () => {
      expect(jsonParseCatch("{}")).toEqual({});
      expect(jsonParseCatch("[]")).toEqual([]);
    });

    it("should handle boolean values", () => {
      expect(jsonParseCatch("true")).toBe(true);
      expect(jsonParseCatch("false")).toBe(false);
    });

    it("should handle null value", () => {
      expect(jsonParseCatch("null")).toBe(null);
    });
  });

  describe("unicode and special characters", () => {
    it("should parse unicode characters", () => {
      const unicode = JSON.stringify({ text: "Hello 世界 🌍" });
      const result = jsonParseCatch(unicode);
      expect(result).toEqual({ text: "Hello 世界 🌍" });
    });

    it("should parse escaped characters", () => {
      const escaped = '{"text":"Hello\\nWorld\\t!"}';
      const result = jsonParseCatch(escaped);
      expect(result).toEqual({ text: "Hello\nWorld\t!" });
    });

    it("should parse unicode escape sequences", () => {
      const unicodeEscape = '{"text":"\\u0048\\u0065\\u006C\\u006C\\u006F"}';
      const result = jsonParseCatch(unicodeEscape);
      expect(result).toEqual({ text: "Hello" });
    });
  });

  describe("whitespace handling", () => {
    it("should parse JSON with various whitespace", () => {
      const withSpaces = '  {  "key"  :  "value"  }  ';
      const result = jsonParseCatch(withSpaces);
      expect(result).toEqual({ key: "value" });
    });

    it("should parse JSON with newlines", () => {
      const withNewlines = '{\n  "key": "value"\n}';
      const result = jsonParseCatch(withNewlines);
      expect(result).toEqual({ key: "value" });
    });

    it("should parse JSON with tabs", () => {
      const withTabs = '{\t"key":\t"value"\t}';
      const result = jsonParseCatch(withTabs);
      expect(result).toEqual({ key: "value" });
    });
  });

  describe("invalid JSON patterns", () => {
    it("should return string for trailing commas", () => {
      expect(jsonParseCatch('{"key": "value",}')).toBe('{"key": "value",}');
      expect(jsonParseCatch('[1, 2, 3,]')).toBe("[1, 2, 3,]");
    });

    it("should return string for unquoted keys", () => {
      expect(jsonParseCatch("{key: 'value'}")).toBe("{key: 'value'}");
    });

    it("should return string for single-quoted strings", () => {
      expect(jsonParseCatch("{'key': 'value'}")).toBe("{'key': 'value'}");
    });

    it("should return string for comments", () => {
      expect(jsonParseCatch('{"key": "value" /* comment */}')).toBe(
        '{"key": "value" /* comment */}',
      );
    });
  });

  describe("large JSON structures", () => {
    it("should parse large arrays", () => {
      const largeArray = JSON.stringify(Array(1000).fill({ id: 1, name: "test" }));
      const result = jsonParseCatch(largeArray);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1000);
    });

    it("should parse large objects", () => {
      const largeObj: Record<string, number> = {};
      for (let i = 0; i < 1000; i++) {
        largeObj[`key${i}`] = i;
      }
      const result = jsonParseCatch(JSON.stringify(largeObj));
      expect(typeof result).toBe("object");
      expect(Object.keys(result as object).length).toBe(1000);
    });
  });

  describe("real-world scenarios", () => {
    it("should parse API response format", () => {
      const apiResponse = JSON.stringify({
        status: 200,
        data: { users: [{ id: 1, name: "John" }] },
        meta: { total: 1, page: 1 },
      });
      const result = jsonParseCatch(apiResponse);
      expect(result).toHaveProperty("status", 200);
      expect(result).toHaveProperty("data");
    });

    it("should parse configuration objects", () => {
      const config = JSON.stringify({
        api: { baseUrl: "https://api.example.com", timeout: 5000 },
        features: { beta: true, experimental: false },
      });
      const result = jsonParseCatch(config);
      expect(result).toHaveProperty("api.baseUrl");
      expect(result).toHaveProperty("features.beta");
    });

    it("should handle malformed user input gracefully", () => {
      const inputs = [
        "not json at all",
        "{broken",
        "undefined",
        "NaN",
        "Infinity",
      ];
      inputs.forEach((input) => {
        const result = jsonParseCatch(input);
        expect(result).toBe(input);
      });
    });
  });

  describe("array parsing", () => {
    it("should parse arrays of primitives", () => {
      expect(jsonParseCatch("[1, 2, 3]")).toEqual([1, 2, 3]);
      expect(jsonParseCatch('["a", "b", "c"]')).toEqual(["a", "b", "c"]);
      expect(jsonParseCatch("[true, false, null]")).toEqual([true, false, null]);
    });

    it("should parse arrays of mixed types", () => {
      const mixed = JSON.stringify([1, "string", true, null, { key: "value" }]);
      const result = jsonParseCatch(mixed);
      expect(result).toEqual([1, "string", true, null, { key: "value" }]);
    });
  });

  describe("string edge cases", () => {
    it("should handle empty quoted string", () => {
      expect(jsonParseCatch('""')).toBe("");
    });

    it("should handle strings with special characters", () => {
      const special = JSON.stringify("Line1\nLine2\tTab\"Quote");
      const result = jsonParseCatch(special);
      expect(result).toBe('Line1\nLine2\tTab"Quote');
    });
  });

  describe("number edge cases", () => {
    it("should handle negative numbers", () => {
      expect(jsonParseCatch("-123")).toBe(-123);
      expect(jsonParseCatch("-123.456")).toBe(-123.456);
    });

    it("should handle very large numbers", () => {
      expect(jsonParseCatch("9007199254740991")).toBe(9007199254740991);
    });

    it("should handle decimal numbers", () => {
      expect(jsonParseCatch("0.1")).toBe(0.1);
      expect(jsonParseCatch("3.14159")).toBe(3.14159);
    });
  });
});
