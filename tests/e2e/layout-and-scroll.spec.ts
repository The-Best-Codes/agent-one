import { expect, test } from "@playwright/test";

test.describe("Layout and autoscroll behaviors", () => {
  test("autoscroll container renders and shows scroll-to-bottom control when user scrolls up from bottom", async ({
    page,
  }) => {
    await page.goto("/");

    const scrollable = page.locator(
      "[data-testid='auto-scroll-container-scrollable']",
    );
    await expect(scrollable).toBeVisible();

    const contentWrapper = scrollable.locator("div").first();
    await expect(contentWrapper).toBeVisible();

    const wrapperSelector =
      "[data-testid='auto-scroll-container-scrollable'] > div";

    await page.evaluate((selector) => {
      const wrapper = document.querySelector(selector);
      if (!wrapper) return;
      wrapper.innerHTML = "";
      for (let i = 0; i < 60; i++) {
        const div = document.createElement("div");
        div.textContent = `Row ${i + 1}`;
        (div.style as CSSStyleDeclaration).height = "48px";
        (div.style as CSSStyleDeclaration).borderBottom =
          "1px solid rgba(0,0,0,0.1)";
        (div.style as CSSStyleDeclaration).display = "flex";
        (div.style as CSSStyleDeclaration).alignItems = "center";
        (div.style as CSSStyleDeclaration).padding = "0 8px";
        wrapper.appendChild(div);
      }
    }, wrapperSelector);

    await page.waitForTimeout(100);
    await page.evaluate((selector) => {
      const wrapper = document.querySelector(selector);
      if (!wrapper) return;
      wrapper.scrollTop = wrapper.scrollHeight - wrapper.clientHeight;
      wrapper.dispatchEvent(new Event("scroll"));
    }, wrapperSelector);

    const hasOverflow = await scrollable.evaluate((el) => {
      return el.scrollHeight > el.clientHeight;
    });
    expect(hasOverflow).toBeTruthy();

    await expect(page.locator("[data-testid='scroll-to-bottom']")).toHaveCount(
      0,
    );

    await scrollable.evaluate((el) => {
      el.scrollTop = Math.max(0, el.scrollTop - 100);
    });

    await page.waitForTimeout(100);

    const scrollToBottomButton = page.locator(
      "[data-testid='scroll-to-bottom']",
    );
    await expect(scrollToBottomButton).toBeVisible();

    await scrollToBottomButton.click();
    await expect(page.locator("[data-testid='scroll-to-bottom']")).toHaveCount(
      0,
    );
  });
});
