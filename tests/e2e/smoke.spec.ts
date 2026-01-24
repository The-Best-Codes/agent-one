import type { ConsoleMessage } from "@playwright/test";
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

test.describe("App smoke test", () => {
  test("loads all pages, has correct title, and renders app root", async ({
    page,
  }) => {
    for (const { path } of routes) {
      await page.addInitScript((routePath) => {
        const onboardingCompleted = routePath !== "/onboarding";
        localStorage.setItem(
          "agent-one-onboarding-completed",
          String(onboardingCompleted),
        );
      }, path);

      await page.goto(path);

      await expect(page).toHaveTitle(/AgentOne/);

      const appRoot = page.locator("#root");
      await expect(appRoot).toBeVisible();

      const h1 = page.locator("h1");
      if (await h1.count()) {
        await expect(h1.first()).toBeVisible();
      }
    }
  });

  test("console has no severe errors on load", async ({ page }) => {
    const errorWhitelist = [
      'ConsoleError: Viewport argument key "interactive-widget" not recognized and ignored.',
    ];

    for (const { path } of routes) {
      const errors: string[] = [];

      const errorHandler = (err: Error) =>
        errors.push(`PageError: ${err?.message ?? String(err)}`);
      const consoleHandler = (msg: ConsoleMessage) => {
        if (msg.type() === "error") {
          const text = `ConsoleError: ${msg.text()}`;
          if (!errorWhitelist.includes(text)) {
            errors.push(text);
          }
        }
      };

      page.on("pageerror", errorHandler);
      page.on("console", consoleHandler);

      await page.addInitScript((routePath) => {
        const onboardingCompleted = routePath !== "/onboarding";
        localStorage.setItem(
          "agent-one-onboarding-completed",
          String(onboardingCompleted),
        );
      }, path);

      await page.goto(path);
      await page.waitForTimeout(500);

      page.off("pageerror", errorHandler);
      page.off("console", consoleHandler);

      expect(
        errors,
        `No severe console/page errors on ${path}. Got:\n${errors.join("\n")}`,
      ).toEqual([]);
    }
  });
});
