import { expect, test } from "vitest";
import SkillSet from "../../src/skill/SkillSet";
import {
  pickFirstChatCompletionChoiceContent,
  pickFirstChatCompletionChoiceTools,
  pickFirstChatCompletionStreamChoice,
  pickFirstChatCompletionStreamRole,
  pickFirstCompletionChoice,
  prop
} from "../../src/util/puref";

const isDev = process.env.NODE_ENV === "development";

const conversation: ConversationMessage[] = [
  {
    role: "system",
    content: `You are a repeater who only repeat whatever I say, by adding 'SIR!' at the end,
        WITHOUT surrounding double/single quotes.`
  },
  {
    role: "user",
    content: "I'm Good."
  }
];

test.runIf(isDev)("GPT3.5 repeater, no stream", async () => {
  const completion = SkillSet.fetchLLMChatCompletion("GPT3_5", conversation, false);
  let data = (await completion.next()).value;
  const response = pickFirstChatCompletionChoiceContent(data);
  expect(response).toBe("I'm Good, SIR!");
});

test.runIf(isDev)("GPT4 repeater, no stream", async () => {
  const completion = SkillSet.fetchLLMChatCompletion("GPT4", conversation, false);
  let data = (await completion.next()).value;
  const response = pickFirstChatCompletionChoiceContent(data);
  expect(response).toBe("I'm Good, SIR!");
});

test.runIf(isDev).skip("GPT3.5 repeater, stream ", async () => {
  let i = 0;
  const TOKENS = ["I", "'m", " Good", ",", " S", "IR", "!"];
  for await (const data of SkillSet.fetchLLMChatCompletion("GPT3_5", conversation, true)) {
    if (i == 0) {
      const role = pickFirstChatCompletionStreamRole(data);
      expect(role).toBe("assistant");
    } else {
      const token = pickFirstChatCompletionStreamChoice(data);
      expect(token).toBe(TOKENS[i - 1]);
    }
    i++;
  }
});

test.runIf(isDev).skip("GPT4 repeater, stream", async () => {
  let i = 0;
  const TOKENS = ["I", "'m", " Good", ",", " S", "IR", "!"];
  for await (const data of SkillSet.fetchLLMChatCompletion("GPT4", conversation, true)) {
    if (i == 0) {
      const role = pickFirstChatCompletionStreamRole(data);
      expect(role).toBe("assistant");
    } else {
      const token = pickFirstChatCompletionStreamChoice(data);
      expect(token).toBe(TOKENS[i - 1]);
    }
    i++;
  }
});

test.runIf(isDev)("GPT3.5-Instruct, no stream", async () => {
  const completion = SkillSet.fetchLLMCompletion(
    "GPT3_5_I",
    `I said to a repeater: "Good". And the repeater exactly echoed:`,
    6,
    false,
    "."
  );
  let data = (await completion.next()).value;
  const response = pickFirstCompletionChoice(data);
  expect(response).toContain("Good");
});

test.runIf(isDev).skip("GPT3.5-Instruct, stream", async () => {
  const completion = SkillSet.fetchLLMCompletion(
    "GPT3_5_I",
    `I said to a repeater: "Good". And the repeater exactly echoed:`,
    6,
    true,
    "."
  );

  const cacheTokens = [];
  for await (const data of completion) {
    const token = pickFirstCompletionChoice(data);
    cacheTokens.push(token);
  }
  expect(cacheTokens.join("")).toContain("Good");
});

test("GPT4-Turbo Tools-Function WebScraping", async () => {
  const functions: ChatCompletionTool[] = [
    {
      type: "function",
      function: {
        name: "scrapeWeb",
        description: SkillSet.scrapeWeb.description,
        parameters: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: "url of target web page"
            }
          },
          required: ["url"]
        }
      }
    }
  ];
  const completion = SkillSet.fetchLLMChatCompletionWithTools(
    "GPT4_T",
    [
      {
        role: "user",
        content: "what's the title of https://www.example.com and https://openai.com ?"
      }
    ],
    functions
  );

  for await (const data of completion) {
    const token = pickFirstChatCompletionChoiceContent(data);
    expect(token).toBeUndefined();

    const toolCalls = pickFirstChatCompletionChoiceTools(data) as ChatCompletionToolCall[];
    const titles = [];
    for (const {
      function: { name: fname, arguments: fargs }
    } of toolCalls) {
      // @ts-ignore
      const scrapeResult = await SkillSet[fname](prop("url", JSON.parse(fargs)));
      titles.push(prop("title", scrapeResult));
    }
    expect(titles).toEqual(["Example Domain", "OpenAI"]);
  }
});
