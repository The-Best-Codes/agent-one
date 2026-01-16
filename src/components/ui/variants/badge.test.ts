import { describe, expect, it } from "vitest";
import { badgeVariants } from "./badge";

describe("badgeVariants", () => {
  describe("default configuration", () => {
    it("should return default variant classes", () => {
      const classes = badgeVariants();
      expect(classes).toContain("bg-primary");
      expect(classes).toContain("text-primary-foreground");
      expect(classes).toContain("border-transparent");
    });

    it("should include base classes", () => {
      const classes = badgeVariants();
      expect(classes).toContain("inline-flex");
      expect(classes).toContain("items-center");
      expect(classes).toContain("justify-center");
      expect(classes).toContain("rounded-md");
      expect(classes).toContain("px-2");
      expect(classes).toContain("py-0.5");
      expect(classes).toContain("text-xs");
    });

    it("should include sizing and layout classes", () => {
      const classes = badgeVariants();
      expect(classes).toContain("w-fit");
      expect(classes).toContain("whitespace-nowrap");
      expect(classes).toContain("shrink-0");
    });
  });

  describe("variant prop", () => {
    it("should apply default variant classes", () => {
      const classes = badgeVariants({ variant: "default" });
      expect(classes).toContain("border-transparent");
      expect(classes).toContain("bg-primary");
      expect(classes).toContain("text-primary-foreground");
    });

    it("should apply secondary variant classes", () => {
      const classes = badgeVariants({ variant: "secondary" });
      expect(classes).toContain("border-transparent");
      expect(classes).toContain("bg-secondary");
      expect(classes).toContain("text-secondary-foreground");
    });

    it("should apply destructive variant classes", () => {
      const classes = badgeVariants({ variant: "destructive" });
      expect(classes).toContain("border-transparent");
      expect(classes).toContain("bg-destructive");
      expect(classes).toContain("text-white");
    });

    it("should apply outline variant classes", () => {
      const classes = badgeVariants({ variant: "outline" });
      expect(classes).toContain("text-foreground");
    });
  });

  describe("interactive states", () => {
    it("should include hover states for anchor tags", () => {
      const classes = badgeVariants({ variant: "default" });
      expect(classes).toContain("[a&]:hover:bg-primary/90");
    });

    it("should include hover states for secondary variant", () => {
      const classes = badgeVariants({ variant: "secondary" });
      expect(classes).toContain("[a&]:hover:bg-secondary/90");
    });

    it("should include hover states for destructive variant", () => {
      const classes = badgeVariants({ variant: "destructive" });
      expect(classes).toContain("[a&]:hover:bg-destructive/90");
    });

    it("should include hover states for outline variant", () => {
      const classes = badgeVariants({ variant: "outline" });
      expect(classes).toContain("[a&]:hover:bg-accent");
      expect(classes).toContain("[a&]:hover:text-accent-foreground");
    });
  });

  describe("accessibility classes", () => {
    it("should include focus-visible classes", () => {
      const classes = badgeVariants();
      expect(classes).toContain("focus-visible:border-ring");
      expect(classes).toContain("focus-visible:ring-ring/50");
    });

    it("should include aria-invalid classes", () => {
      const classes = badgeVariants();
      expect(classes).toContain("aria-invalid:ring-destructive/20");
      expect(classes).toContain("aria-invalid:border-destructive");
    });

    it("should include dark mode aria-invalid classes", () => {
      const classes = badgeVariants();
      expect(classes).toContain("dark:aria-invalid:ring-destructive/40");
    });
  });

  describe("icon support", () => {
    it("should include svg sizing and spacing classes", () => {
      const classes = badgeVariants();
      expect(classes).toContain("[&>svg]:size-3");
      expect(classes).toContain("gap-1");
      expect(classes).toContain("[&>svg]:pointer-events-none");
    });
  });

  describe("transitions", () => {
    it("should include transition classes", () => {
      const classes = badgeVariants();
      expect(classes).toContain("transition-[color,box-shadow]");
    });
  });

  describe("dark mode support", () => {
    it("should include dark mode classes for destructive variant", () => {
      const classes = badgeVariants({ variant: "destructive" });
      expect(classes).toContain("dark:bg-destructive/60");
      expect(classes).toContain("dark:focus-visible:ring-destructive/40");
    });
  });
});
