import { describe, expect, it } from "vitest";
import { buttonVariants } from "./button";

describe("buttonVariants", () => {
  describe("default configuration", () => {
    it("should return default variant and size classes", () => {
      const classes = buttonVariants();
      expect(classes).toContain("bg-primary");
      expect(classes).toContain("text-primary-foreground");
      expect(classes).toContain("h-9");
    });

    it("should include base classes", () => {
      const classes = buttonVariants();
      expect(classes).toContain("inline-flex");
      expect(classes).toContain("items-center");
      expect(classes).toContain("justify-center");
      expect(classes).toContain("rounded-md");
      expect(classes).toContain("disabled:pointer-events-none");
      expect(classes).toContain("disabled:opacity-50");
    });
  });

  describe("variant prop", () => {
    it("should apply default variant classes", () => {
      const classes = buttonVariants({ variant: "default" });
      expect(classes).toContain("bg-primary");
      expect(classes).toContain("text-primary-foreground");
      expect(classes).toContain("hover:bg-primary/90");
    });

    it("should apply destructive variant classes", () => {
      const classes = buttonVariants({ variant: "destructive" });
      expect(classes).toContain("bg-destructive");
      expect(classes).toContain("text-white");
      expect(classes).toContain("hover:bg-destructive/90");
    });

    it("should apply outline variant classes", () => {
      const classes = buttonVariants({ variant: "outline" });
      expect(classes).toContain("border");
      expect(classes).toContain("bg-background");
      expect(classes).toContain("hover:bg-accent");
    });

    it("should apply secondary variant classes", () => {
      const classes = buttonVariants({ variant: "secondary" });
      expect(classes).toContain("bg-secondary");
      expect(classes).toContain("text-secondary-foreground");
      expect(classes).toContain("hover:bg-secondary/80");
    });

    it("should apply ghost variant classes", () => {
      const classes = buttonVariants({ variant: "ghost" });
      expect(classes).toContain("hover:bg-accent");
      expect(classes).toContain("hover:text-accent-foreground");
    });

    it("should apply link variant classes", () => {
      const classes = buttonVariants({ variant: "link" });
      expect(classes).toContain("text-primary");
      expect(classes).toContain("underline-offset-4");
      expect(classes).toContain("hover:underline");
    });
  });

  describe("size prop", () => {
    it("should apply default size classes", () => {
      const classes = buttonVariants({ size: "default" });
      expect(classes).toContain("h-9");
      expect(classes).toContain("px-4");
    });

    it("should apply sm size classes", () => {
      const classes = buttonVariants({ size: "sm" });
      expect(classes).toContain("h-8");
      expect(classes).toContain("px-3");
    });

    it("should apply lg size classes", () => {
      const classes = buttonVariants({ size: "lg" });
      expect(classes).toContain("h-10");
      expect(classes).toContain("px-6");
    });

    it("should apply icon size classes", () => {
      const classes = buttonVariants({ size: "icon" });
      expect(classes).toContain("size-9");
    });

    it("should apply icon-sm size classes", () => {
      const classes = buttonVariants({ size: "icon-sm" });
      expect(classes).toContain("size-8");
    });

    it("should apply icon-lg size classes", () => {
      const classes = buttonVariants({ size: "icon-lg" });
      expect(classes).toContain("size-10");
    });
  });

  describe("combined variant and size", () => {
    it("should combine destructive variant with sm size", () => {
      const classes = buttonVariants({ variant: "destructive", size: "sm" });
      expect(classes).toContain("bg-destructive");
      expect(classes).toContain("h-8");
    });

    it("should combine outline variant with lg size", () => {
      const classes = buttonVariants({ variant: "outline", size: "lg" });
      expect(classes).toContain("border");
      expect(classes).toContain("h-10");
    });

    it("should combine ghost variant with icon size", () => {
      const classes = buttonVariants({ variant: "ghost", size: "icon" });
      expect(classes).toContain("hover:bg-accent");
      expect(classes).toContain("size-9");
    });

    it("should combine link variant with default size", () => {
      const classes = buttonVariants({ variant: "link", size: "default" });
      expect(classes).toContain("text-primary");
      expect(classes).toContain("h-9");
    });
  });

  describe("accessibility classes", () => {
    it("should include focus-visible classes", () => {
      const classes = buttonVariants();
      expect(classes).toContain("focus-visible:border-ring");
      expect(classes).toContain("focus-visible:ring-ring/50");
    });

    it("should include aria-invalid classes", () => {
      const classes = buttonVariants();
      expect(classes).toContain("aria-invalid:ring-destructive/20");
      expect(classes).toContain("aria-invalid:border-destructive");
    });
  });

  describe("icon support", () => {
    it("should include svg sizing classes", () => {
      const classes = buttonVariants();
      expect(classes).toContain("[&_svg]:pointer-events-none");
      expect(classes).toContain("[&_svg]:shrink-0");
    });
  });
});
