import { expect, test } from "vitest";
import NormalAgent from "../../src/agent/NormalAgent";
import BaseInterpreter from "../../src/interpreters/BaseInterpreter";
import JavaScriptInterpreter from "../../src/interpreters/JavaScriptInterpreter";
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

test("GPT4 WebScraping", async () => {
  await expect(runWebScrapingAgent("GPT4")).resolves.toBe("Example Domain");
});

test("GPT3.5 WebScraping", async () => {
  await expect(runWebScrapingAgent("GPT3_5")).resolves.toBe("Example Domain");
});
