import { expect, test } from "@playwright/test";

test.describe("Main Chat Input", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("[data-testid='home-main']")).toBeVisible();
    await expect(page.locator("[data-testid='chat-form']")).toBeVisible();
  });

  test("renders editor, attach and send buttons with correct initial states", async ({
    page,
  }) => {
    const editor = page.locator("[data-testid='chat-editor']");
    const attachButton = page.locator("[data-testid='attach-button']");
    const sendButton = page.locator("[data-testid='send-button']");

    await expect(editor).toBeVisible();
    await expect(attachButton).toBeVisible();
    await expect(sendButton).toBeVisible();

    await expect(sendButton).toBeDisabled();
  });

  test("typing in editor enables send, pressing Enter submits and clears the editor", async ({
    page,
  }) => {
    const editor = page.locator("[data-testid='chat-editor']");
    const sendButton = page.locator("[data-testid='send-button']");

    await editor.fill("Hello world!");

    await expect(sendButton).toBeEnabled();

    await page.keyboard.press("Enter");

    await expect(sendButton).toBeDisabled();

    await editor.click();
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.press("Backspace");

    await expect(sendButton).toBeDisabled();
  });

  test("attach files: shows count badge, previews, and supports removal", async ({
    page,
  }) => {
    const attachButton = page.locator("[data-testid='attach-button']");
    const sendButton = page.locator("[data-testid='send-button']");
    const form = page.locator("[data-testid='chat-form']");

    const fileInput = form.locator("input[type='file']");

    await expect(fileInput).toHaveCount(1);

    await fileInput.setInputFiles([
      {
        name: "hello.txt",
        mimeType: "text/plain",
        buffer: Buffer.from("This is a test"),
      },
      {
        name: "image.png",
        mimeType: "image/png",
        buffer: Buffer.from(
          "89504e470d0a1a0a0000000d4948445200000001000000010802000000907724df0000000a49444154789c6360000002000154a02b050000000049454e44ae426082",
          "hex",
        ),
      },
    ]);

    const badge = attachButton.locator("[data-slot='badge']");
    await expect(badge).toBeVisible();
    await expect(badge).toHaveText("2");

    const previewsContainer = page.locator("div:has(> div.flex.flex-nowrap)");

    const attachmentChips = previewsContainer.locator(
      "div.group.flex.items-center.gap-2.border.rounded-md.p-2.bg-background.relative.shrink-0",
    );
    await expect(attachmentChips).toHaveCount(2);

    await expect(
      attachmentChips.nth(0).locator("span.text-sm.font-medium"),
    ).toHaveText(/hello\.txt/);

    const hasImagePreview =
      (await attachmentChips.nth(0).locator("img").count()) +
        (await attachmentChips.nth(1).locator("img").count()) >
      0;
    expect(hasImagePreview).toBeTruthy();

    const firstRemoveButton = attachmentChips
      .nth(0)
      .locator("button[title='Remove file']");
    await firstRemoveButton.click();

    await expect(badge).toHaveText("1");

    await expect(attachmentChips).toHaveCount(1);

    await expect(sendButton).toBeEnabled();

    await sendButton.click();

    await expect(previewsContainer).toHaveCount(0);

    await expect(badge).toHaveCount(0);

    await expect(sendButton).toBeDisabled();
  });

  test("Shift+Enter should not send (stay in editor), Enter should send", async ({
    page,
  }) => {
    const editor = page.locator("[data-testid='chat-editor']");
    const sendButton = page.locator("[data-testid='send-button']");

    await editor.click();
    await page.keyboard.type("Line 1");
    await page.keyboard.press("Shift+Enter");
    await page.keyboard.type("Line 2");

    await expect(sendButton).toBeEnabled();

    await page.keyboard.press("Enter");

    await expect(sendButton).toBeDisabled();
  });
});
