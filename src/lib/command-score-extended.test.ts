import { describe, expect, it } from "vitest";
import { commandScore } from "@/lib/command-score";

describe("commandScore - Extended Edge Cases", () => {
  describe("unicode and special characters", () => {
    it("should handle unicode characters in exact matches", () => {
      expect(commandScore("café", "café", [])).toBeGreaterThan(0);
      expect(commandScore("naïve", "naïve", [])).toBeGreaterThan(0);
      expect(commandScore("日本語", "日本", [])).toBeGreaterThan(0);
    });

    it("should handle emojis", () => {
      expect(commandScore("test 🎉", "test", [])).toBeGreaterThan(0);
      expect(commandScore("🚀 rocket", "rocket", [])).toBeGreaterThan(0);
    });

    it("should handle mixed case unicode", () => {
      expect(commandScore("Café", "café", [])).toBeGreaterThan(0);
    });
  });

  describe("very long strings", () => {
    it("should handle very long strings efficiently", () => {
      const longString = "a".repeat(1000);
      const score = commandScore(longString, "a", []);
      expect(score).toBeGreaterThan(0);
    });

    it("should handle long strings with matches", () => {
      const longString = "prefix_" + "x".repeat(500) + "_suffix";
      const score = commandScore(longString, "ps", []);
      expect(score).toBeGreaterThan(0);
    });
  });

  describe("repeated characters", () => {
    it("should handle repeated character patterns", () => {
      expect(commandScore("aaabbbccc", "abc", [])).toBeGreaterThan(0);
      expect(commandScore("test-test-test", "ttt", [])).toBeGreaterThan(0);
    });

    it("should score continuous vs scattered matches differently", () => {
      const continuous = commandScore("testing", "tes", []);
      const scattered = commandScore("tahbecsding", "tes", []);
      expect(continuous).toBeGreaterThan(scattered);
    });
  });

  describe("word boundary edge cases", () => {
    it("should handle multiple consecutive separators", () => {
      expect(commandScore("test--word", "tw", [])).toBeGreaterThan(0);
      expect(commandScore("test__word", "tw", [])).toBeGreaterThan(0);
      expect(commandScore("test..word", "tw", [])).toBeGreaterThan(0);
    });

    it("should handle mixed separators", () => {
      expect(commandScore("test-word_item.value", "twiv", [])).toBeGreaterThan(0);
    });
  });

  describe("alias scoring", () => {
    it("should score matches in aliases", () => {
      const withAlias = commandScore("cmd", "test", ["test-command"]);
      expect(withAlias).toBeGreaterThan(0);
    });

    it("should combine string and alias scores", () => {
      const score = commandScore("command", "cmd", ["cmd"]);
      expect(score).toBeGreaterThan(0);
    });

    it("should handle multiple long aliases", () => {
      const aliases = [
        "very-long-alias-name",
        "another-long-alias",
        "third-alias-option",
      ];
      const score = commandScore("short", "vla", aliases);
      expect(score).toBeGreaterThan(0);
    });
  });

  describe("abbreviation patterns", () => {
    it("should score camelCase abbreviations highly", () => {
      expect(commandScore("getUserData", "gud", [])).toBeGreaterThan(0);
      expect(commandScore("handleButtonClick", "hbc", [])).toBeGreaterThan(0);
    });

    it("should score kebab-case abbreviations", () => {
      expect(commandScore("get-user-data", "gud", [])).toBeGreaterThan(0);
    });

    it("should score snake_case abbreviations", () => {
      expect(commandScore("get_user_data", "gud", [])).toBeGreaterThan(0);
    });

    it("should score dot.case abbreviations", () => {
      expect(commandScore("user.data.store", "uds", [])).toBeGreaterThan(0);
    });
  });

  describe("performance scenarios", () => {
    it("should handle many aliases efficiently", () => {
      const manyAliases = Array(50)
        .fill("alias")
        .map((a, i) => `${a}-${i}`);
      const score = commandScore("test", "te", manyAliases);
      expect(score).toBeGreaterThan(0);
    });

    it("should handle complex nested patterns", () => {
      const complex = "src/components/ui/button/variants/primary.tsx";
      const score = commandScore(complex, "scubvp", []);
      expect(score).toBeGreaterThan(0);
    });
  });

  describe("transposition cases", () => {
    it("should detect and score transpositions", () => {
      const score = commandScore("tset", "test", []);
      expect(score).toBeGreaterThan(0);
    });

    it("should handle multiple transpositions", () => {
      const score = commandScore("tsetest", "test", []);
      expect(score).toBeGreaterThan(0);
    });
  });

  describe("memoization behavior", () => {
    it("should return consistent scores for same input", () => {
      const score1 = commandScore("testing", "test", []);
      const score2 = commandScore("testing", "test", []);
      expect(score1).toBe(score2);
    });

    it("should handle different inputs correctly", () => {
      const score1 = commandScore("testing", "test", []);
      const score2 = commandScore("testing", "best", []);
      expect(score1).not.toBe(score2);
    });
  });

  describe("numeric patterns", () => {
    it("should handle numbers in strings", () => {
      expect(commandScore("file123.txt", "f1", [])).toBeGreaterThan(0);
      expect(commandScore("version2.0.1", "v2", [])).toBeGreaterThan(0);
    });

    it("should handle pure numeric abbreviations", () => {
      expect(commandScore("test123", "123", [])).toBeGreaterThan(0);
    });
  });

  describe("path-like strings", () => {
    it("should score file paths effectively", () => {
      const path = "src/components/Button.tsx";
      expect(commandScore(path, "scb", [])).toBeGreaterThan(0);
      expect(commandScore(path, "Button", [])).toBeGreaterThan(0);
    });

    it("should handle deep nested paths", () => {
      const deepPath = "a/b/c/d/e/f/g/h/file.tsx";
      expect(commandScore(deepPath, "abcdef", [])).toBeGreaterThan(0);
    });
  });
});
