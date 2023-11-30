import { expect, test } from "vitest";
import {
  euclideanDistance,
  selectTopKMMRWithCosine,
  splitTextIntoParagraphs,
  splitTextIntoSentences
} from "../../src/util/embedding";
import { nth } from "../../src/util/puref";

test("euclidean distance", () => {
  expect(euclideanDistance([1, 0], [0, 1])).toBe(Math.sqrt(2));
  expect(euclideanDistance([1, 0], [1, 1])).toBe(1);
});

test("topKMMR, 4, 3", () => {
  const query = [5, 0, 0];
  const embeddings = [
    [4, 3, 0],
    [3, 4, 0],
    [-4, 3, 0]
  ];
  const selected = selectTopKMMRWithCosine(query, embeddings, 3, 0.8);
  expect(selected.map(nth(1))).toEqual([0, 1, 2]);
});

test("topKMMR, 0.9, 0.8", () => {
  const query = [1, 0, 1];
  const embeddings = [
    [1, 0, 0.9],
    [1, 0, 0.8],
    [0.7, 0, 1]
  ];
  const selected = selectTopKMMRWithCosine(query, embeddings, 3, 0.5);
  expect(selected.map(nth(1))).toEqual([0, 2, 1]);
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
