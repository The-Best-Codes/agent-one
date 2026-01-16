import { describe, expect, it } from "vitest";
import { buttonGroupVariants } from "./button-group";

describe("buttonGroupVariants", () => {
  describe("default configuration", () => {
    it("should return default orientation classes", () => {
      const classes = buttonGroupVariants();
      expect(classes).toContain("flex");
      expect(classes).toContain("w-fit");
    });

    it("should include base layout classes", () => {
      const classes = buttonGroupVariants();
      expect(classes).toContain("items-stretch");
    });

    it("should include focus-visible z-index classes", () => {
      const classes = buttonGroupVariants();
      expect(classes).toContain("[&>*]:focus-visible:z-10");
      expect(classes).toContain("[&>*]:focus-visible:relative");
    });
  });

  describe("orientation prop", () => {
    it("should apply horizontal orientation classes", () => {
      const classes = buttonGroupVariants({ orientation: "horizontal" });
      expect(classes).toContain("[&>*:not(:first-child)]:rounded-l-none");
      expect(classes).toContain("[&>*:not(:first-child)]:border-l-0");
      expect(classes).toContain("[&>*:not(:last-child)]:rounded-r-none");
    });

    it("should apply vertical orientation classes", () => {
      const classes = buttonGroupVariants({ orientation: "vertical" });
      expect(classes).toContain("flex-col");
      expect(classes).toContain("[&>*:not(:first-child)]:rounded-t-none");
      expect(classes).toContain("[&>*:not(:first-child)]:border-t-0");
      expect(classes).toContain("[&>*:not(:last-child)]:rounded-b-none");
    });
  });

  describe("default orientation", () => {
    it("should default to horizontal orientation", () => {
      const classes = buttonGroupVariants();
      expect(classes).toContain("[&>*:not(:first-child)]:rounded-l-none");
    });
  });

  describe("special element handling", () => {
    it("should include select trigger width classes", () => {
      const classes = buttonGroupVariants();
      expect(classes).toContain(
        "[&>[data-slot=select-trigger]:not([class*='w-'])]:w-fit",
      );
    });

    it("should include input flex classes", () => {
      const classes = buttonGroupVariants();
      expect(classes).toContain("[&>input]:flex-1");
    });

    it("should include nested button-group gap classes", () => {
      const classes = buttonGroupVariants();
      expect(classes).toContain("has-[>[data-slot=button-group]]:gap-2");
    });
  });

  describe("edge cases", () => {
    it("should handle select trigger rounding for hidden selects", () => {
      const classes = buttonGroupVariants();
      expect(classes).toContain(
        "has-[select[aria-hidden=true]:last-child]:[&>[data-slot=select-trigger]:last-of-type]:rounded-r-md",
      );
    });
  });

  describe("variant combinations", () => {
    it("should work with explicit horizontal orientation", () => {
      const classes = buttonGroupVariants({ orientation: "horizontal" });
      expect(classes).toContain("flex");
      expect(classes).toContain("[&>*:not(:first-child)]:border-l-0");
    });

    it("should work with explicit vertical orientation", () => {
      const classes = buttonGroupVariants({ orientation: "vertical" });
      expect(classes).toContain("flex-col");
      expect(classes).toContain("[&>*:not(:first-child)]:border-t-0");
    });
  });
});
