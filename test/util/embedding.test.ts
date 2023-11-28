import { expect, test } from "vitest";
import { splitTextIntoParagraphs } from "../../src/util/embedding";

test("split paragraph", () => {
  const splits = splitTextIntoParagraphs(
    "This is a paragraph.\n\nThis is another paragraph.",
    "\n\n",
    {}
  );
  expect(splits).toEqual(["This is a paragraph.", "This is another paragraph."]);
});

test("splits paragraphs with chunk size", () => {
  let splits = splitTextIntoParagraphs(
    "This is a paragraph.\nThis is another paragraph.",
    "\n",
    { chunkSize: 100 }
  );
  expect(splits).toEqual(["This is a paragraph.\nThis is another paragraph."]);
});
