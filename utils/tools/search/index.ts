import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

interface SearchResult {
  title: string | null;
  link: string | null;
  description: string | null;
  icon: string | null;
  domain: string | null;
}

export async function scrapeGoogleSearchResults(
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

    // Block unnecessary resources
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const resourceType = req.resourceType();
      const url = req.url();

      if (["stylesheet", "font"].includes(resourceType)) {
        req.abort();
        return;
      }
    });

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

    // Extract search results
    const searchResults: SearchResult[] = await page.evaluate(() => {
      let results: SearchResult[] = [];
      console.log("Document: ", document);
      const resultElements = document.querySelectorAll(".MjjYud"); // This targets the main container for each result

      resultElements.forEach((resultElement) => {
        try {
          const titleElement = resultElement.querySelector("h3");
          const title = titleElement ? titleElement.textContent : null;

          const linkElement = resultElement.querySelector("a[href]");
          const link = linkElement ? linkElement.getAttribute("href") : null;

          const iconElement = resultElement.querySelector("img.XNo5Ab");
          const icon = iconElement ? iconElement.getAttribute("src") : null;

          const descriptionElement = resultElement.querySelector(".VwiC3b"); // Description classname
          const description = descriptionElement
            ? descriptionElement.textContent
            : null;

          const domainElement = resultElement.querySelector(".VuuXrf");
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
    console.error("Error scraping Google search results:", error);
    throw new Error("Failed to scrape Google search results.");
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
