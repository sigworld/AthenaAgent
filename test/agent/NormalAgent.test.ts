import { expect, test } from "vitest";
import NormalAgent from "../../src/agent/NormalAgent";
import BaseInterpreter from "../../src/interpreters/BaseInterpreter";
import JavaScriptInterpreter from "../../src/interpreters/JavaScriptVmInterpreter";
import SkillSet from "../../src/skill/SkillSet";

const resultAggregator = (): TokenAggregator => {
  let result: unknown[] = [];
  return {
    more: (res: unknown) => {
      result.push(res);
    },
    getAll: () => result,
    get: () => result.at(-1)
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
  return result.getAll().at(-1);
}

test.skip("GPT4 WebScraping", async () => {
  await expect(runWebScrapingAgent("GPT4")).resolves.toBe("Example Domain");
});

test.skip("GPT3.5 WebScraping", async () => {
  await expect(runWebScrapingAgent("GPT3_5")).resolves.toBe("Example Domain");
});

async function buildAndRunWebScrapingAgent(model: LLMType) {
  const agent = new NormalAgent(
    model,
    new BaseInterpreter(),
    new JavaScriptInterpreter().provideFunctionTool(SkillSet.scrapingBuildTools)
  );
  const result = resultAggregator();
  await agent.run("What's the title of web page https://www.example.com", result);
  return result.getAll().at(-1);
}

test("GPT3.5 Build and Run WebScraping", async () => {
  await expect(buildAndRunWebScrapingAgent("GPT3_5")).resolves.toBe("Example Domain");
});

test.skip("GPT4 Build and Run WebScraping", async () => {
  await expect(buildAndRunWebScrapingAgent("GPT4")).resolves.toBe("Example Domain");
});
