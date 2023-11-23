import { expect, test } from "vitest";
import SkillSet from "../../src/skill/SkillSet";
import {
  pickFirstChatCompletionChoice,
  pickFirstChatCompletionStreamChoice,
  pickFirstChatCompletionStreamRole,
  pickFirstCompletionChoice
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
  const response = pickFirstChatCompletionChoice(data);
  expect(response).toBe("I'm Good, SIR!");
});

test.runIf(isDev)("GPT4 repeater, no stream", async () => {
  const completion = SkillSet.fetchLLMChatCompletion("GPT4", conversation, false);
  let data = (await completion.next()).value;
  const response = pickFirstChatCompletionChoice(data);
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
