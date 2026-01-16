import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("cn (className utility) - Extended Coverage", () => {
  describe("complex Tailwind merging scenarios", () => {
    it("should merge complex padding utilities", () => {
      expect(cn("p-4", "px-8")).toBe("p-4 px-8");
      expect(cn("p-4", "p-8")).toBe("p-8");
      expect(cn("px-4", "p-8")).toBe("p-8");
    });

    it("should merge complex margin utilities", () => {
      expect(cn("m-4", "mx-8")).toBe("m-4 mx-8");
      expect(cn("m-4", "m-8")).toBe("m-8");
      expect(cn("mx-4", "m-8")).toBe("m-8");
    });

    it("should handle responsive variants correctly", () => {
      expect(cn("text-sm", "md:text-lg", "lg:text-xl")).toBe(
        "text-sm md:text-lg lg:text-xl",
      );
      expect(cn("text-sm", "md:text-sm")).toBe("text-sm md:text-sm");
    });

    it("should merge color utilities", () => {
      expect(cn("bg-red-500", "bg-blue-500")).toBe("bg-blue-500");
      expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
    });

    it("should merge border utilities", () => {
      expect(cn("border", "border-2")).toBe("border-2");
      expect(cn("border-red-500", "border-blue-500")).toBe("border-blue-500");
    });
  });

  describe("array and object combinations", () => {
    it("should handle nested arrays", () => {
      expect(cn(["a", ["b", ["c", "d"]]])).toBe("a b c d");
    });

    it("should handle multiple objects", () => {
      expect(
        cn({ a: true, b: false }, { c: true, d: false }, { e: true }),
      ).toBe("a c e");
    });

    it("should handle mixed arrays and objects", () => {
      expect(cn(["a", { b: true, c: false }], { d: true })).toBe("a b d");
    });

    it("should handle nested structures as clsx supports", () => {
      // clsx doesn't support deeply nested objects in arrays
      expect(cn(["a", { b: true }])).toBe("a b");
    });
  });

  describe("conditional class combinations", () => {
    it("should handle ternary expressions", () => {
      const condition = true;
      expect(cn("base", condition ? "active" : "inactive")).toBe("base active");
    });

    it("should handle && operators", () => {
      expect(cn("base", true && "show", false && "hide")).toBe("base show");
    });

    it("should handle || operators", () => {
      expect(cn("base", false || "fallback")).toBe("base fallback");
    });

    it("should handle nullish coalescing", () => {
      expect(cn("base", null ?? "default", undefined ?? "default2")).toBe(
        "base default default2",
      );
    });
  });

  describe("tailwind-merge specific behavior", () => {
    it("should keep non-conflicting utilities", () => {
      expect(cn("flex", "items-center", "justify-between")).toBe(
        "flex items-center justify-between",
      );
    });

    it("should handle arbitrary values", () => {
      expect(cn("w-[100px]", "w-[200px]")).toBe("w-[200px]");
      expect(cn("bg-[#ff0000]", "bg-[#00ff00]")).toBe("bg-[#00ff00]");
    });

    it("should handle negative values", () => {
      expect(cn("-m-4", "-m-8")).toBe("-m-8");
      expect(cn("m-4", "-m-8")).toBe("-m-8");
    });

    it("should handle important modifiers", () => {
      // Important classes are handled by tailwind-merge
      expect(cn("!text-red-500", "text-blue-500")).toBe(
        "!text-red-500 text-blue-500",
      );
    });
  });

  describe("pseudo-class variants", () => {
    it("should handle hover variants", () => {
      expect(cn("hover:bg-red-500", "hover:bg-blue-500")).toBe(
        "hover:bg-blue-500",
      );
    });

    it("should handle focus variants", () => {
      expect(cn("focus:ring-2", "focus:ring-4")).toBe("focus:ring-4");
    });

    it("should handle active variants", () => {
      expect(cn("active:scale-95", "active:scale-90")).toBe("active:scale-90");
    });

    it("should handle group variants", () => {
      expect(cn("group-hover:text-red-500", "group-hover:text-blue-500")).toBe(
        "group-hover:text-blue-500",
      );
    });
  });

  describe("responsive and state combinations", () => {
    it("should handle responsive hover", () => {
      expect(cn("md:hover:bg-red-500", "md:hover:bg-blue-500")).toBe(
        "md:hover:bg-blue-500",
      );
    });

    it("should handle dark mode with responsive", () => {
      expect(cn("dark:md:text-white", "dark:md:text-black")).toBe(
        "dark:md:text-black",
      );
    });

    it("should keep different responsive breakpoints", () => {
      expect(cn("sm:text-sm", "md:text-md", "lg:text-lg")).toBe(
        "sm:text-sm md:text-md lg:text-lg",
      );
    });
  });

  describe("edge cases with empty values", () => {
    it("should handle multiple empty strings", () => {
      expect(cn("", "", "valid", "", "")).toBe("valid");
    });

    it("should handle multiple nulls and undefined", () => {
      expect(cn(null, undefined, "valid", null, undefined)).toBe("valid");
    });

    it("should handle mixed empty values", () => {
      expect(cn("", null, undefined, false, "valid", 0)).toBe("valid");
    });
  });

  describe("performance scenarios", () => {
    it("should handle many classes efficiently", () => {
      const manyClasses = Array(100)
        .fill("class")
        .map((c, i) => `${c}-${i}`);
      const result = cn(...manyClasses);
      expect(result).toBeDefined();
      expect(result.split(" ").length).toBe(100);
    });

    it("should handle many conditional classes", () => {
      const conditions = Array(50)
        .fill(true)
        .map((v, i) => v && `class-${i}`);
      const result = cn(...conditions);
      expect(result.split(" ").length).toBe(50);
    });
  });

  describe("real-world component patterns", () => {
    it("should handle button variant pattern", () => {
      const variant = "primary";
      const size = "lg";
      const disabled = false;

      const className = cn(
        "btn",
        variant === "primary" && "bg-blue-500",
        size === "lg" && "px-8 py-4",
        disabled && "opacity-50",
      );

      expect(className).toContain("btn");
      expect(className).toContain("bg-blue-500");
      expect(className).toContain("px-8");
      expect(className).not.toContain("opacity-50");
    });

    it("should handle card component pattern", () => {
      const isHovered = true;
      const isSelected = false;

      const className = cn(
        "card rounded-lg border",
        isHovered && "shadow-lg",
        isSelected && "border-blue-500",
        !isSelected && "border-gray-200",
      );

      expect(className).toContain("card");
      expect(className).toContain("shadow-lg");
      expect(className).toContain("border-gray-200");
    });
  });

  describe("arbitrary value merging", () => {
    it("should merge arbitrary width values", () => {
      expect(cn("w-[100px]", "w-[200px]")).toBe("w-[200px]");
    });

    it("should merge arbitrary color values", () => {
      expect(cn("bg-[#ff0000]", "bg-[#00ff00]")).toBe("bg-[#00ff00]");
    });

    it("should handle arbitrary values with calc", () => {
      expect(cn("w-[calc(100%-20px)]", "w-[calc(100%-40px)]")).toBe(
        "w-[calc(100%-40px)]",
      );
    });
  });

  describe("class deduplication", () => {
    it("should deduplicate same non-conflicting class", () => {
      // tailwind-merge deduplicates identical classes
      expect(cn("flex", "items-center", "flex")).toBe("items-center flex");
    });

    it("should properly override conflicting classes", () => {
      expect(cn("text-sm", "text-lg", "text-sm")).toBe("text-sm");
    });
  });
});
