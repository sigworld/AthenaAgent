import { expect, test } from "vitest";
import SkillSet from "../../src/skill/SkillSet";
import {
  pickFirstCompletionChoice,
  pickFirstCompletionStreamChoice,
  pickFirstCompletionStreamRole
} from "../../src/util/puref";

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

test("GPT3.5 repeater, no stream", async () => {
  const completion = SkillSet.fetchLLMCompletion("GPT3_5", conversation, false);
  let data = (await completion.next()).value;
  const response = pickFirstCompletionChoice(data);
  expect(response).toBe("I'm Good, SIR!");
});

test("GPT4 repeater, no stream", async () => {
  const completion = SkillSet.fetchLLMCompletion("GPT4", conversation, false);
  let data = (await completion.next()).value;
  const response = pickFirstCompletionChoice(data);
  expect(response).toBe("I'm Good, SIR!");
});

test("GPT3.5 repeater, stream ", async () => {
  let i = 0;
  const TOKENS = ["I", "'m", " Good", ",", " S", "IR", "!"];
  for await (const data of SkillSet.fetchLLMCompletion("GPT3_5", conversation, true)) {
    if (i == 0) {
      const role = pickFirstCompletionStreamRole(data);
      expect(role).toBe("assistant");
    } else {
      const token = pickFirstCompletionStreamChoice(data);
      expect(token).toBe(TOKENS[i - 1]);
    }
    i++;
  }
});

test("GPT4 repeater, stream", async () => {
  let i = 0;
  const TOKENS = ["I", "'m", " Good", ",", " S", "IR", "!"];
  for await (const data of SkillSet.fetchLLMCompletion("GPT4", conversation, true)) {
    if (i == 0) {
      const role = pickFirstCompletionStreamRole(data);
      expect(role).toBe("assistant");
    } else {
      const token = pickFirstCompletionStreamChoice(data);
      expect(token).toBe(TOKENS[i - 1]);
    }
    i++;
  }
});
