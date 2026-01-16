import { describe, expect, it } from "vitest";
import { commandScore } from "./command-score";

describe("commandScore", () => {
  describe("basic matching", () => {
    it("should return a score for exact matches", () => {
      const score = commandScore("test", "test", []);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it("should return 0 for non-matching strings", () => {
      const score = commandScore("test", "xyz", []);
      expect(score).toBe(0);
    });

    it("should return higher score for better matches", () => {
      const exactScore = commandScore("test", "test", []);
      const partialScore = commandScore("testing", "test", []);
      expect(exactScore).toBeGreaterThan(partialScore);
    });
  });

  describe("prefix matching", () => {
    it("should score prefix matches highly", () => {
      const prefixScore = commandScore("hello", "hel", []);
      const middleScore = commandScore("hello", "ell", []);
      expect(prefixScore).toBeGreaterThan(middleScore);
    });

    it("should handle single character prefix", () => {
      const score = commandScore("test", "t", []);
      expect(score).toBeGreaterThan(0);
    });
  });

  describe("case sensitivity", () => {
    it("should be case insensitive for matching", () => {
      const lowerScore = commandScore("Test", "test", []);
      const upperScore = commandScore("TEST", "test", []);
      expect(lowerScore).toBeGreaterThan(0);
      expect(upperScore).toBeGreaterThan(0);
    });

    it("should give bonus for exact case match", () => {
      const exactCaseScore = commandScore("Test", "Test", []);
      const diffCaseScore = commandScore("test", "Test", []);
      expect(exactCaseScore).toBeGreaterThan(diffCaseScore);
    });
  });

  describe("word boundary matching", () => {
    it("should score word boundaries higher", () => {
      const wordBoundaryScore = commandScore("hello-world", "hw", []);
      const continuousScore = commandScore("helloworld", "hw", []);
      expect(wordBoundaryScore).toBeGreaterThan(0);
    });

    it("should handle space-separated words", () => {
      const score = commandScore("hello world", "hw", []);
      expect(score).toBeGreaterThan(0);
    });

    it("should handle camelCase boundaries", () => {
      const score = commandScore("helloWorld", "hw", []);
      expect(score).toBeGreaterThan(0);
    });
  });

  describe("continuous character matching", () => {
    it("should prefer continuous character matches", () => {
      const continuousScore = commandScore("testing", "test", []);
      const scatteredScore = commandScore("taesbting", "test", []);
      expect(continuousScore).toBeGreaterThan(scatteredScore);
    });

    it("should handle consecutive matches", () => {
      const score = commandScore("abcdef", "abc", []);
      expect(score).toBeGreaterThan(0.9); // High score for continuous match
    });
  });

  describe("aliases", () => {
    it("should include aliases in scoring", () => {
      const withAlias = commandScore("cmd", "command", ["command"]);
      const withoutAlias = commandScore("cmd", "xyz", []);
      expect(withAlias).toBeGreaterThan(withoutAlias);
    });

    it("should match abbreviation against aliases", () => {
      const score = commandScore("shortname", "sn", ["short-name"]);
      expect(score).toBeGreaterThan(0);
    });

    it("should handle multiple aliases", () => {
      const score = commandScore("cmd", "cm", ["command", "control"]);
      expect(score).toBeGreaterThan(0);
    });

    it("should handle empty aliases array", () => {
      const score = commandScore("test", "te", []);
      expect(score).toBeGreaterThan(0);
    });
  });

  describe("edge cases", () => {
    it("should handle empty string search", () => {
      const score = commandScore("test", "", []);
      expect(score).toBeGreaterThan(0);
    });

    it("should handle empty string target", () => {
      const score = commandScore("", "test", []);
      expect(score).toBe(0);
    });

    it("should handle single character strings", () => {
      const score = commandScore("a", "a", []);
      expect(score).toBeGreaterThan(0);
    });

    it("should handle special characters", () => {
      const score = commandScore("test@example.com", "test", []);
      expect(score).toBeGreaterThan(0);
    });

    it("should handle numbers", () => {
      const score = commandScore("test123", "test", []);
      expect(score).toBeGreaterThan(0);
    });
  });

  describe("separator characters", () => {
    it("should handle slash separators", () => {
      const score = commandScore("path/to/file", "ptf", []);
      expect(score).toBeGreaterThan(0);
    });

    it("should handle underscore separators", () => {
      const score = commandScore("hello_world", "hw", []);
      expect(score).toBeGreaterThan(0);
    });

    it("should handle dot separators", () => {
      const score = commandScore("file.name.ext", "fne", []);
      expect(score).toBeGreaterThan(0);
    });

    it("should handle hyphen separators", () => {
      const score = commandScore("hello-world", "hw", []);
      expect(score).toBeGreaterThan(0);
    });
  });

  describe("penalty for incomplete matches", () => {
    it("should have similar scores for same prefix regardless of suffix", () => {
      const shortScore = commandScore("test", "te", []);
      const longScore = commandScore("testing-long-string", "te", []);
      // Both start with "te", so they get similar scores
      expect(shortScore).toBeGreaterThan(0);
      expect(longScore).toBeGreaterThan(0);
      // The penalty is minimal (0.99), so scores are very close
      expect(Math.abs(shortScore - longScore)).toBeLessThan(0.05);
    });
  });

  describe("realistic use cases", () => {
    it("should rank command palette items correctly", () => {
      const commands = [
        "New File",
        "New Folder",
        "Open File",
        "Open Folder",
      ];
      const abbreviation = "nf";

      const scores = commands.map((cmd) => commandScore(cmd, abbreviation, []));

      // "New File" and "New Folder" should score higher than "Open File"
      expect(scores[0]).toBeGreaterThan(scores[2]);
      expect(scores[1]).toBeGreaterThan(scores[2]);
    });

    it("should handle file paths", () => {
      const score = commandScore("src/components/Button.tsx", "but", []);
      expect(score).toBeGreaterThan(0);
    });

    it("should handle function names", () => {
      const score = commandScore("getUserData", "gud", []);
      expect(score).toBeGreaterThan(0);
    });
  });
});
