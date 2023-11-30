import { expect, test } from "vitest";
import {
  euclideanDistance,
  splitTextIntoParagraphs,
  splitTextIntoSentences
} from "../../src/util/embedding";

test("euclidean distance", () => {
  expect(euclideanDistance([1, 0], [0, 1])).toBe(Math.sqrt(2));
  expect(euclideanDistance([1, 0], [1, 1])).toBe(1);
});

test("split paragraph", () => {
  const splits = splitTextIntoParagraphs(
    "This is a paragraph.\n\nThis is another paragraph.",
    {}
  );
  expect(splits).toEqual(["This is a paragraph.", "This is another paragraph."]);
});

test("splits paragraphs with chunk size", () => {
  const splits = splitTextIntoParagraphs("This is a paragraph.\nThis is another paragraph.", {
    chunkSize: 100
  });
  expect(splits).toEqual(["This is a paragraph.\nThis is another paragraph."]);
});

test("split sentences", () => {
  const sentenceSplits = splitTextIntoSentences(
    "This is a.This is b. This is c! 这是一个句子. 这是另一个句子。这还是一个句子"
  );
  expect(sentenceSplits).toHaveLength(5);
});
