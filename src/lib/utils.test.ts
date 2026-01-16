import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn (className utility)", () => {
  it("should merge simple class names", () => {
    expect(cn("class1", "class2")).toBe("class1 class2");
  });

  it("should handle conditional classes", () => {
    expect(cn("class1", false && "class2", "class3")).toBe("class1 class3");
    expect(cn("class1", true && "class2", "class3")).toBe("class1 class2 class3");
  });

  it("should merge Tailwind conflicting classes correctly", () => {
    // twMerge should keep the last class when there's a conflict
    expect(cn("p-4", "p-8")).toBe("p-8");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
    expect(cn("bg-gray-100", "bg-white")).toBe("bg-white");
  });

  it("should handle arrays of classes", () => {
    expect(cn(["class1", "class2"])).toBe("class1 class2");
    expect(cn(["class1", false && "class2", "class3"])).toBe("class1 class3");
  });

  it("should handle objects with boolean values", () => {
    expect(cn({ class1: true, class2: false, class3: true })).toBe(
      "class1 class3",
    );
  });

  it("should handle undefined and null", () => {
    expect(cn("class1", undefined, "class2", null)).toBe("class1 class2");
  });

  it("should handle empty strings", () => {
    expect(cn("class1", "", "class2")).toBe("class1 class2");
  });

  it("should handle duplicate classes", () => {
    // cn doesn't deduplicate non-conflicting classes, it just merges them
    expect(cn("class1", "class2", "class1")).toBe("class1 class2 class1");
  });

  it("should handle complex Tailwind utilities", () => {
    expect(cn("hover:bg-blue-500", "hover:bg-red-500")).toBe(
      "hover:bg-red-500",
    );
    expect(cn("md:text-lg", "lg:text-xl")).toBe("md:text-lg lg:text-xl");
  });

  it("should handle mix of static and conditional classes", () => {
    const isActive = true;
    const isDisabled = false;
    expect(
      cn("base-class", isActive && "active-class", isDisabled && "disabled-class"),
    ).toBe("base-class active-class");
  });

  it("should handle nested arrays", () => {
    expect(cn(["class1", ["class2", "class3"]])).toBe("class1 class2 class3");
  });

  it("should handle empty input", () => {
    expect(cn()).toBe("");
  });

  it("should preserve non-conflicting Tailwind classes", () => {
    expect(cn("p-4", "m-2", "bg-blue-500")).toBe("p-4 m-2 bg-blue-500");
  });

  it("should handle responsive variants correctly", () => {
    expect(cn("text-sm", "md:text-base", "lg:text-lg")).toBe(
      "text-sm md:text-base lg:text-lg",
    );
  });

  it("should handle dark mode variants", () => {
    expect(cn("bg-white", "dark:bg-black")).toBe("bg-white dark:bg-black");
  });
});
