import { isNilEmpty } from "./puref";

const splitTextIntoSentences = (text: string, options: { chunkSize: number }) => {};

export const splitTextIntoParagraphs = (
  text: string,
  paragraphSeparator: string,
  options: { chunkSize?: number } = { chunkSize: 1024 }
) => {
  if (isNilEmpty(text)) throw new Error("no text to split");

  // get paragraph splits
  let paragraphSplits: string[] = text.split(paragraphSeparator);
  if (options?.chunkSize) {
    let idx = 0;

    // merge paragraphs that are too small
    while (idx < paragraphSplits.length) {
      if (idx < paragraphSplits.length - 1 && paragraphSplits[idx].length < options.chunkSize) {
        paragraphSplits[idx] = [paragraphSplits[idx], paragraphSplits[idx + 1]].join(
          paragraphSeparator
        );
        paragraphSplits.splice(idx + 1, 1);
      } else {
        idx += 1;
      }
    }
  }

  return paragraphSplits;
};
