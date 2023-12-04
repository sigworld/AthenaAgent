import { expect, test } from "vitest";
import {
  KnowledgeBaseDocument,
  LocalFileVectorStore,
  buildKnowledgeBaseDocument
} from "../../src/embedding/VectorStore";
import { readFileContent } from "../../src/skill/FileIO";
import SkillSet from "../../src/skill/SkillSet";
import { splitTextIntoSentences } from "../../src/util/embedding";
import { pickFirstChatCompletionChoiceContent, prop } from "../../src/util/puref";

test.skip("VectorStore - build a json store", async () => {
  const fullText = readFileContent("example/data/alice.txt");
  const texts = splitTextIntoSentences(fullText);

  const doc = await buildKnowledgeBaseDocument("Alice in Wonderland", texts, {
    url: "https://www.fairytales.biz/lewis-carroll/alice-in-wonderland.html"
  });
  const fileStore = new LocalFileVectorStore();
  fileStore.addDocument("AliceInWonderLand", doc.getDocument());
  fileStore.persist("example/data/alice.json");
});

test("VectorStore - load from a json store and run an augmented query", async () => {
  {
    const aliceStore = LocalFileVectorStore.fromFile("example/data/alice.json");
    const embeddedDoc = aliceStore.findDocument("AliceInWonderLand");
    const doc = new KnowledgeBaseDocument(embeddedDoc);

    const queryStr = "Who was reading a book beside Alice?";

    const results = await doc.query([queryStr], 3, true);
    const matchWithContext = results.map(({ text, augmentedTexts }) => ({
      text: [augmentedTexts.prev.join(" "), text, augmentedTexts.next.join(" ")].join(" "),
      relavant: `${augmentedTexts.similar.join("\n")}`
    }));
    const completion = await SkillSet.fetchLLMChatCompletion(
      "GPT3_5",
      [
        {
          role: "user",
          content: `${matchWithContext.map(prop("text")).join("\n")}\n\n${queryStr}`
        }
      ],
      false
    );
    let data = (await completion.next()).value;
    const answer = pickFirstChatCompletionChoiceContent(data);
    expect(answer).toEqual("Alice's sister was reading a book beside Alice.");
  }
}, 6000);
