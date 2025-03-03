import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import TurndownService from "turndown";

export async function scrapePageToMarkdown(url: string): Promise<string> {
  let browser = null;
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless === "shell" ? "shell" : true,
    });
    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36",
    );

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

    // Remove script, style and noscript tags
    await page.evaluate(() => {
      const elementsToRemove = ["script", "style", "noscript"];
      elementsToRemove.forEach((tag) => {
        document.querySelectorAll(tag).forEach((element) => {
          element.remove();
        });
      });
    });

    const html = await page.content();

    const turndownService = new TurndownService({
      headingStyle: "atx",
      hr: "---",
      bulletListMarker: "-",
      codeBlockStyle: "fenced",
      emDelimiter: "*",
      strongDelimiter: "**",
      linkStyle: "inlined",
      linkReferenceStyle: "collapsed",
    });

    const markdown = turndownService.turndown(html);

    return markdown;
  } catch (error: any) {
    console.error("Error converting page to markdown:", error);
    throw new Error("Failed to convert page to markdown.");
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (browserError) {
        console.error("Error closing browser:", browserError);
      }
    }
  }
}
