import { isNilEmpty } from "./puref";

/**
 * Tokenizes sentences. Suitable for English, Chinese, Japanese, and Korean.
 * Allows English delimeters in CJK context
 */
const sentenceTokenizer = (text: string) => {
  return text.match(/.+?[.?!]+[\])'"`’”]*(?:\s|$)|.+?[。？！.?!]+?[\])）'"`’”]*(?:\s|$)?|.+/g);
  // return text.match(/.+?[。？！.?!]+[\])）'"`’”]*(?:\s|$)?|.+/g);
};

export const splitTextIntoSentences = (text: string) => {
  const sentenceSplits = sentenceTokenizer(text).map((x) => x.trim());
  return sentenceSplits;
};

export const splitTextIntoParagraphs = (
  text: string,
  options: { chunkSize?: number } = { chunkSize: 1024 }
) => {
  if (isNilEmpty(text)) throw new Error("no text to split");

  // get paragraph splits
  let paragraphSplits: string[] = text.split(/[\r\n]?\n[\r\n]?\n/);
  if (options?.chunkSize) {
    let idx = 0;

    // merge paragraphs that are too small
    while (idx < paragraphSplits.length) {
      if (idx < paragraphSplits.length - 1 && paragraphSplits[idx].length < options.chunkSize) {
        paragraphSplits[idx] = [paragraphSplits[idx], paragraphSplits[idx + 1]].join("\n");
        paragraphSplits.splice(idx + 1, 1);
      } else {
        idx += 1;
      }
    }
  }

  return paragraphSplits;
};
