import axios from "axios";
import * as cheerio from "cheerio";

export const scrapeWeb: SkillFunction<{
  title: string;
  content: string;
  imageUrls: string[];
  hyperlinks: string[];
}> = async (url: string) => {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const title = $("title").text();
    const content = $("body").text();
    const imageUrls = $("img")
      .map((_, el) => $(el).attr("src"))
      .get();
    const hyperlinks = $("a")
      .map((_, el) => $(el).attr("href"))
      .get();
    return { title, content, imageUrls, hyperlinks };
  } catch (error) {
    return;
  }
};
scrapeWeb.description = `
scrapeWeb: (url: string) => Promise<{title: string, content: string, imageUrls: string[], hyperlinks: string[]}> // Scrape web page of the given url, return '{title, content, imageUrls, hyperlinks}' on success, otherwise return '{}'.
`;
scrapeWeb.callable = true;

export const scrapingBuildTools: SkillFunction<void> = () => {};
scrapingBuildTools.callable = false;
scrapingBuildTools.deps = ["axios", "cheerio"];
