import { describe, expect, it } from "vitest";
import { jsonParseCatch } from "./json-parse-catch";

describe("jsonParseCatch", () => {
  it("should parse valid JSON strings", () => {
    expect(jsonParseCatch('{"key": "value"}')).toEqual({ key: "value" });
    expect(jsonParseCatch('["a", "b", "c"]')).toEqual(["a", "b", "c"]);
    expect(jsonParseCatch("123")).toBe(123);
    expect(jsonParseCatch('"string"')).toBe("string");
    expect(jsonParseCatch("true")).toBe(true);
    expect(jsonParseCatch("false")).toBe(false);
    expect(jsonParseCatch("null")).toBe(null);
  });

  it("should return original string for invalid JSON", () => {
    expect(jsonParseCatch("not valid json")).toBe("not valid json");
    expect(jsonParseCatch("{invalid}")).toBe("{invalid}");
    expect(jsonParseCatch("undefined")).toBe("undefined");
  });

  it("should handle null input", () => {
    expect(jsonParseCatch(null)).toBe(null);
  });

  it("should handle undefined input", () => {
    expect(jsonParseCatch(undefined)).toBe(undefined);
  });

  it("should handle empty strings", () => {
    expect(jsonParseCatch("")).toBe("");
  });

  it("should parse nested JSON objects", () => {
    const nested = '{"outer": {"inner": {"deep": "value"}}}';
    expect(jsonParseCatch(nested)).toEqual({
      outer: { inner: { deep: "value" } },
    });
  });

  it("should parse JSON arrays with objects", () => {
    const arrayWithObjects = '[{"id": 1}, {"id": 2}]';
    expect(jsonParseCatch(arrayWithObjects)).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it("should return malformed JSON as-is", () => {
    expect(jsonParseCatch('{"key": undefined}')).toBe('{"key": undefined}');
    expect(jsonParseCatch("{key: 'value'}")).toBe("{key: 'value'}");
  });

  it("should handle whitespace in valid JSON", () => {
    expect(jsonParseCatch('  {"key": "value"}  ')).toEqual({ key: "value" });
    expect(jsonParseCatch('\n["a", "b"]\n')).toEqual(["a", "b"]);
  });
});
