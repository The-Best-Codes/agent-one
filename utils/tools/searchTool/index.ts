import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

interface SearchResult {
  title: string | null;
  link: string | null;
  description: string | null;
  icon: string | null;
  domain: string | null;
}

export async function scrapeBingSearchResults(
  url: string,
): Promise<SearchResult[]> {
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

    // Extract search results
    const searchResults: SearchResult[] = await page.evaluate(() => {
      let results: SearchResult[] = [];
      const resultList = document.querySelector("#b_results"); // Select the parent <ol>

      if (!resultList) {
        console.warn("Could not find the result list element.");
        return results; // Return an empty array if the list isn't found
      }

      const resultElements = resultList.querySelectorAll("li.b_algo"); // Select <li> elements with class "b_algo"

      resultElements.forEach((resultElement) => {
        try {
          const titleElement = resultElement.querySelector("h2 a"); // Get the title from the h2 > a
          const title = titleElement ? titleElement.textContent : null;

          const linkElement = resultElement.querySelector("h2 a"); // Link also from h2 > a
          const link = linkElement ? linkElement.getAttribute("href") : null;

          const descriptionElement =
            resultElement.querySelector(".b_caption p"); // Find description in .b_caption p
          const description = descriptionElement
            ? descriptionElement.textContent
            : null;

          const iconElement = resultElement.querySelector(".cico img"); // Find icon in .cico img
          const icon = iconElement ? iconElement.getAttribute("src") : null;

          const domainElement = resultElement.querySelector(
            ".b_attribution cite",
          );
          const domain = domainElement ? domainElement.textContent : null;

          results.push({
            title,
            link,
            description,
            icon,
            domain,
          });
        } catch (error) {
          console.error("Error processing a search result:", error);
        }
      });

      return results;
    });

    return searchResults;
  } catch (error: any) {
    console.error("Error scraping Bing search results:", error);
    throw new Error("Failed to scrape Bing search results.");
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
