import { AxeBuilder } from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { sectionsMetadata } from "../../src/routes/settings/sections-metadata";

type RouteConfig = {
  path: string;
  label: string;
};

const routes: RouteConfig[] = [
  {
    path: "/onboarding",
    label: "Onboarding",
  },
  { path: "/chat", label: "Chat" },
  ...sectionsMetadata.map((section) => ({
    path: `/settings?tab=${section.id}`,
    label: `Settings - ${section.label}`,
  })),
];

test.describe("Accessibility", () => {
  routes.forEach(({ path, label }) => {
    test(`${label} has no critical accessibility violations`, async ({ page }) => {
      await page.addInitScript((routePath) => {
        const onboardingCompleted = routePath !== "/onboarding";
        localStorage.setItem("agent-one-onboarding-completed", String(onboardingCompleted));
      }, path);

      await page.goto(path);

      await expect(page.locator("main[role='main']")).toBeVisible();

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags([
          "wcag2a",
          "wcag2aa",
          "wcag21a",
          "wcag21aa",
          "wcag22a",
          "wcag22aa",
          "best-practice",
        ])
        .disableRules([
          // "color-contrast"
        ])
        .analyze();

      const violations = accessibilityScanResults.violations;

      expect(
        violations,
        `Expected no a11y violations. Found:\n${violations
          .map((v) => `- ${v.id}: ${v.description}\n  Help: ${v.helpUrl}`)
          .join("\n")}`,
      ).toEqual([]);
    });
  });
});
