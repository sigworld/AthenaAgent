import { expect, test } from "vitest";
import SkillSet from "../../src/skill/SkillSet";
import {
  cosineSimilarity,
  selectTopKWithCosine,
  selectTopKWithEuclidean
} from "../../src/util/embedding";
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

test.runIf(isDev).skip("GPT3.5 repeater, no stream", async () => {
  const completion = SkillSet.fetchLLMChatCompletion("GPT3_5", conversation, false);
  let data = (await completion.next()).value;
  const response = pickFirstChatCompletionChoiceContent(data);
  expect(response).toBe("I'm Good, SIR!");
});

test.runIf(isDev)("GPT3.5 Turbo repeater, no stream, json mode", async () => {
  const jsonConversation: ConversationMessage[] = [
    {
      role: "user",
      content: "I'm Good. Echo my word in json." // NOTE: must mention json in some form in content
    }
  ];
  const completion = SkillSet.fetchLLMChatCompletion("GPT3_5_T", jsonConversation, false, true);
  let data = (await completion.next()).value;
  const response = pickFirstChatCompletionChoiceContent(data) as string;
  expect(JSON.parse(response)).toEqual({ word: "Good" });
});

test.runIf(isDev).skip("GPT4 repeater, no stream", async () => {
  const completion = SkillSet.fetchLLMChatCompletion("GPT4", conversation, false);
  let data = (await completion.next()).value;
  const response = pickFirstChatCompletionChoiceContent(data);
  expect(response).toBe("I'm Good, SIR!");
});

test.runIf(isDev)("GPT4 repeater, no stream, json mode", async () => {
  const jsonConversation: ConversationMessage[] = [
    {
      role: "user",
      content: "I'm Good. Echo my word in json." // NOTE: must mention json in some form in content
    }
  ];
  const completion = SkillSet.fetchLLMChatCompletion("GPT4_T", jsonConversation, false, true);
  let data = (await completion.next()).value;
  const response = pickFirstChatCompletionChoiceContent(data) as string;
  expect(JSON.parse(response)).toEqual({ response: "I'm Good." });
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

test.runIf(isDev).skip("GPT3.5-Instruct, no stream", async () => {
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

function gptToolsFunctionChatCompletion(model: LLMType) {
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

  return SkillSet.fetchLLMChatCompletionWithTools(
    model,
    [
      {
        role: "user",
        content: "what's the title of https://www.example.com and https://openai.com ?"
      }
    ],
    functions
  );
}

test.runIf(isDev)("GPT3.5-Turbo Tools-Function WebScraping", async () => {
  const completion = gptToolsFunctionChatCompletion("GPT3_5_T");
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

test.runIf(isDev)("GPT4-Turbo Tools-Function WebScraping", async () => {
  const completion = gptToolsFunctionChatCompletion("GPT4_T");
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

test.runIf(isDev)("Ada002 Embedding", async () => {
  const embeddings = await SkillSet.fetchLLMEmbedding(["Hi", "你好", "こんにちは", "مرحبًا"])!;
  expect(cosineSimilarity(embeddings[0], embeddings[0])).toBeGreaterThan(0.999);
  expect(cosineSimilarity(embeddings[1], embeddings[1])).toBeGreaterThan(0.999);
  expect(cosineSimilarity(embeddings[0], embeddings[1])).toBeGreaterThan(0.8);
  expect(cosineSimilarity(embeddings[1], embeddings[2])).toBeGreaterThan(0.8);
  expect(cosineSimilarity(embeddings[2], embeddings[3])).toBeGreaterThan(0.8);
  expect(cosineSimilarity(embeddings[3], embeddings[0])).toBeGreaterThan(0.8);
});

test("Ada002 Embedding and TopK Retrieval using Cosine Similarity", async () => {
  const sources = [
    "It is a lovely dog",
    "That is a very happy person",
    "Today is a sunny day",
    "他是个幸福的人",
    "那个人很开心"
  ];
  const embeddings = await SkillSet.fetchLLMEmbedding(sources)!;
  const query = await SkillSet.fetchLLMEmbedding("That is a happy person");
  const similarTexts = selectTopKWithCosine(query[0], embeddings, 2, 0.7).map(
    ([index]) => sources[index]
  );
  expect(similarTexts).toEqual(["That is a very happy person", "那个人很开心"]);
});

// with Ada002 Embedding, I still haven't found any scenario that could tell Cosine Similarity from Euclidean Distance
test("Ada002 Embedding and TopK Retrieval using Euclidean Distance", async () => {
  const sources = [
    "Driver arrested after woman fell out of car and was seriously injured in Etobicoke, police say",
    "Henry Kissinger, polarizing statesman who shaped U.S. foreign policy in Vietnam War era, dead at 100",
    "Firearms ban amendments about votes, not safety, say P.E.I. gun owners", // selected as top 2
    "Man killed in Langside rooming-house shooting had 'the biggest heart,' sister says",
    "Non-profit offers free Starlink internet to Ulukhaktok; residents say they're good",
    "Canada needs sophisticated discussion on firearm ban, says gun magazine editor", // selected as top 1
    "Polytechnique mass shooting survivor slams gun rights group for using 'POLY' promo code"
  ];
  const embeddings = await SkillSet.fetchLLMEmbedding(sources)!;
  const query = await SkillSet.fetchLLMEmbedding("headlines criticizing gun control laws");
  const similarTextsEuclidean = selectTopKWithEuclidean(query[0], embeddings, 2);
  const similarTextsCosine = selectTopKWithCosine(query[0], embeddings, 2);
  expect(similarTextsEuclidean).toEqual(similarTextsCosine);
});
