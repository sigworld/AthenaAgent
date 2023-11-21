import { expect, test } from "vitest";
import { scrapeWeb } from "../../src/skill/WebSearch";

test("WebScraping", async () => {
  const webInfo = await scrapeWeb("https://www.example.com");
  expect(webInfo.title).toBe("Example Domain");
});
