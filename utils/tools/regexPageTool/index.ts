import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

export async function regexSearchPageContent(
  url: string,
  regex: string,
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

    const pageContent = await page.evaluate(() => {
      return document.body.textContent;
    });

    if (!pageContent) {
      throw new Error(`Failed to retrieve page content from ${url}`);
    }

    const matches = [];
    const re = new RegExp(regex, "g");
    let match;

    while ((match = re.exec(pageContent)) !== null) {
      matches.push(match[0]); // Push the full match
    }

    return matches;
  } catch (error: any) {
    console.error(`Error searching page ${url} with regex ${regex}: ${error}`);
    throw new Error(`Failed to search page ${url} with regex.`);
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
