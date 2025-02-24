import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

export async function scrapePageContent(
  url: string,
  selector: string,
): Promise<Array<string>> {
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

    const content = await page.evaluate((selector) => {
      const elements = Array.from(document.querySelectorAll(selector));
      return elements.map((element) => element.outerHTML);
    }, selector);

    return content;
  } catch (error: any) {
    console.error(`Error scraping page ${url}: ${error}`);
    throw new Error(`Failed to scrape page ${url}.`);
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
