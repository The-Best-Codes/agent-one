import { expect, test } from "@playwright/test";

test.describe("App smoke test", () => {
  test("loads home page, has correct title, and renders app root", async ({
    page,
  }) => {
    await page.goto("/chat");

    await expect(page).toHaveTitle(/AgentOne/);

    const appRoot = page.locator("#root");
    await expect(appRoot).toBeVisible();

    const h1 = page.locator("h1");
    if (await h1.count()) {
      await expect(h1.first()).toBeVisible();
    }
  });

  test("console has no severe errors on load", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) =>
      errors.push(`PageError: ${err?.message ?? String(err)}`),
    );
    page.on("console", (msg) => {
      const type = msg.type();
      if (type === "error") {
        errors.push(`ConsoleError: ${msg.text()}`);
      }
    });

    await page.goto("/chat");

    await page.waitForTimeout(500);

    expect(
      errors,
      `No severe console/page errors expected. Got:\n${errors.join("\n")}`,
    ).toEqual([]);
  });
});
