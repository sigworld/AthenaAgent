import { expect, test } from "vitest";
import NormalAgent from "../../src/agent/NormalAgent";
import BaseInterpreter from "../../src/interpreters/BaseInterpreter";
import JavaScriptInterpreter from "../../src/interpreters/JavaScriptInterpreter";
import SkillSet from "../../src/skill/SkillSet";

const isDev = process.env.NODE_ENV === "development";

const resultAggregator = (): TokenAggregator => {
  let result: unknown[] = [];
  return {
    more: (res: unknown) => {
      result.push(res);
    },
    tokenArray: () => result,
    get: () => result.join("")
  };
};

async function runWebScrapingAgent(model: LLMType) {
  const agent = new NormalAgent(
    model,
    new BaseInterpreter(),
    new JavaScriptInterpreter().provideFunctionTool(SkillSet.scrapeWeb)
  );
  const result = resultAggregator();
  await agent.run("What's the title of web page https://www.example.com", result);
  return result.get();
}

test.runIf(isDev)("GPT4 WebScraping", async () => {
  await expect(runWebScrapingAgent("GPT4")).resolves.toContain("Example Domain");
});

test.runIf(isDev)("GPT3.5 WebScraping", async () => {
  await expect(runWebScrapingAgent("GPT3_5")).resolves.toContain("Example Domain");
});

async function buildAndRunWebScrapingAgent(model: LLMType) {
  const agent = new NormalAgent(
    model,
    new BaseInterpreter(),
    new JavaScriptInterpreter().provideFunctionTool(SkillSet.scrapingBuildTools)
  );
  const result = resultAggregator();
  await agent.run("What's the title of web page https://www.example.com", result);
  return result.get();
}

test.runIf(isDev)("GPT3.5 Build and Run WebScraping", async () => {
  await expect(buildAndRunWebScrapingAgent("GPT3_5")).resolves.toContain("Example Domain");
});

test.runIf(isDev)("GPT4 Build and Run WebScraping", async () => {
  await expect(buildAndRunWebScrapingAgent("GPT4")).resolves.toContain("Example Domain");
});
