import { describe, expect, it } from "vitest";
import { toggleVariants } from "./toggle";

describe("toggleVariants", () => {
  describe("default configuration", () => {
    it("should return default variant and size classes", () => {
      const classes = toggleVariants();
      expect(classes).toContain("bg-transparent");
      expect(classes).toContain("h-9");
      expect(classes).toContain("px-2");
    });

    it("should include base classes", () => {
      const classes = toggleVariants();
      expect(classes).toContain("inline-flex");
      expect(classes).toContain("items-center");
      expect(classes).toContain("justify-center");
      expect(classes).toContain("rounded-md");
      expect(classes).toContain("text-sm");
    });

    it("should include disabled state classes", () => {
      const classes = toggleVariants();
      expect(classes).toContain("disabled:pointer-events-none");
      expect(classes).toContain("disabled:opacity-50");
    });
  });

  describe("variant prop", () => {
    it("should apply default variant classes", () => {
      const classes = toggleVariants({ variant: "default" });
      expect(classes).toContain("bg-transparent");
    });

    it("should apply outline variant classes", () => {
      const classes = toggleVariants({ variant: "outline" });
      expect(classes).toContain("border");
      expect(classes).toContain("border-input");
      expect(classes).toContain("bg-transparent");
      expect(classes).toContain("shadow-xs");
    });
  });

  describe("size prop", () => {
    it("should apply default size classes", () => {
      const classes = toggleVariants({ size: "default" });
      expect(classes).toContain("h-9");
      expect(classes).toContain("px-2");
      expect(classes).toContain("min-w-9");
    });

    it("should apply sm size classes", () => {
      const classes = toggleVariants({ size: "sm" });
      expect(classes).toContain("h-8");
      expect(classes).toContain("px-1.5");
      expect(classes).toContain("min-w-8");
    });

    it("should apply lg size classes", () => {
      const classes = toggleVariants({ size: "lg" });
      expect(classes).toContain("h-10");
      expect(classes).toContain("px-2.5");
      expect(classes).toContain("min-w-10");
    });
  });

  describe("combined variant and size", () => {
    it("should combine default variant with sm size", () => {
      const classes = toggleVariants({ variant: "default", size: "sm" });
      expect(classes).toContain("bg-transparent");
      expect(classes).toContain("h-8");
    });

    it("should combine outline variant with lg size", () => {
      const classes = toggleVariants({ variant: "outline", size: "lg" });
      expect(classes).toContain("border");
      expect(classes).toContain("h-10");
    });
  });

  describe("interactive states", () => {
    it("should include hover classes", () => {
      const classes = toggleVariants();
      expect(classes).toContain("hover:bg-muted");
      expect(classes).toContain("hover:text-muted-foreground");
    });

    it("should include data-state=on classes", () => {
      const classes = toggleVariants();
      expect(classes).toContain("data-[state=on]:bg-accent");
      expect(classes).toContain("data-[state=on]:text-accent-foreground");
    });

    it("should include outline variant hover classes", () => {
      const classes = toggleVariants({ variant: "outline" });
      expect(classes).toContain("hover:bg-accent");
      expect(classes).toContain("hover:text-accent-foreground");
    });
  });

  describe("accessibility classes", () => {
    it("should include focus-visible classes", () => {
      const classes = toggleVariants();
      expect(classes).toContain("focus-visible:border-ring");
      expect(classes).toContain("focus-visible:ring-ring/50");
      expect(classes).toContain("focus-visible:ring-[3px]");
      expect(classes).toContain("outline-none");
    });

    it("should include aria-invalid classes", () => {
      const classes = toggleVariants();
      expect(classes).toContain("aria-invalid:ring-destructive/20");
      expect(classes).toContain("aria-invalid:border-destructive");
    });

    it("should include dark mode aria-invalid classes", () => {
      const classes = toggleVariants();
      expect(classes).toContain("dark:aria-invalid:ring-destructive/40");
    });
  });

  describe("icon support", () => {
    it("should include svg sizing classes", () => {
      const classes = toggleVariants();
      expect(classes).toContain("[&_svg]:pointer-events-none");
      expect(classes).toContain("[&_svg]:shrink-0");
    });
  });

  describe("layout classes", () => {
    it("should include gap and whitespace classes", () => {
      const classes = toggleVariants();
      expect(classes).toContain("gap-2");
      expect(classes).toContain("whitespace-nowrap");
    });
  });

  describe("transitions", () => {
    it("should include transition classes", () => {
      const classes = toggleVariants();
      expect(classes).toContain("transition-[color,box-shadow]");
    });
  });
});
