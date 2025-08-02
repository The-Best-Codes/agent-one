import { AxeBuilder } from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("Accessibility - Home page", () => {
  test("has no critical accessibility violations on load", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("main[role='main']")).toBeVisible();

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "best-practice"])
      .disableRules([
        // "color-contrast"
      ])
      .analyze();

    const violations = accessibilityScanResults.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );

    expect(
      violations,
      `Expected no serious/critical a11y violations. Found:\n${violations
        .map((v) => `- ${v.id}: ${v.description}\n  Help: ${v.helpUrl}`)
        .join("\n")}`,
    ).toEqual([]);
  });
});
