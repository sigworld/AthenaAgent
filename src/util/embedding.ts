import R from "rambda";
import {
  ascendCompareFn,
  decendCompareFn as descendCompareFn,
  isNilEmpty,
  max,
  maxBy,
  notNilEmpty
} from "./puref";

export const calcNorm = R.compose(
  Math.sqrt,
  R.reduce((prev: number, v: number) => prev + v ** 2, 0)
);

/**
 * Calculates Euclidean distance between two vectors.
 *
 * suitable for clustering and classification tasks
 */
export const euclideanDistance = (vec1: number[], vec2: number[]): number => {
  const diffVec = vec1.map((v1, i) => v1 - vec2[i]);
  return calcNorm(diffVec);
};

/**
 * used when searching for relevance
 *
 * @throws {Error} If the norm of any of the vectors is zero.
 */
export const cosineSimilarity = (vec1: number[], vec2: number[]): number => {
  const norms = R.map(calcNorm)([vec1, vec2]);
  if (R.any(R.equals(0))(norms)) {
    throw new Error("norms being zero");
  }
  return dotProd(vec1, vec2) / (norms[0] * norms[1]);
};

export const dotProd = (vec1: number[], vec2: number[]): number => {
  if (!R.eqBy(R.length)(vec1, vec2) && notNilEmpty(vec1) && notNilEmpty(vec2)) {
    throw new Error("vectors should have the same length and not empty");
  }

  return vec1.reduce((prod, v1, i) => prod + v1 * vec2[i], 0);
};

/**
 * Tokenizes sentences. Suitable for English, Chinese, Japanese, and Korean.
 * Allows English delimeters in CJK context
 */
const sentenceTokenizer = (text: string) => {
  return text.match(/.+?[.?!]+[\])'"`’”]*(?:\s|$)|.+?[。？！.?!]+?[\])）'"`’”]*(?:\s|$)?|.+/g);
};

export const splitTextIntoSentences = (text: string) => {
  const sentenceSplits = sentenceTokenizer(text).map((x) => x.trim());
  // TODO: merge sentences that are too short
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

/**
 * find the most (ir-)relevant items
 */
export const selectTopKWithCosine = (
  queryVector: number[],
  embeddingVectors: number[][],
  selectTopCounter: number,
  threshold: number = 0.7,
  sameDirection: boolean = true
): [index: number, similarity: number][] => {
  const topKEmbeddings: [number, number][] = embeddingVectors.map((embedding, i) => [
    cosineSimilarity(embedding, queryVector),
    i
  ]);
  return topKEmbeddings
    .filter(([val]) => (sameDirection ? val > threshold : val < threshold))
    .sort(([a], [b]) => (sameDirection ? descendCompareFn(a, b) : ascendCompareFn(a, b)))
    .slice(0, selectTopCounter)
    .map(([v, i]) => [i, v]);
};

/**
 * find the most (ir-)relevant items
 */
export const selectTopKWithEuclidean = (
  queryVector: number[],
  embeddingVectors: number[][],
  selectTopCounter: number,
  closerFirst: boolean = true
): [index: number, similarity: number][] => {
  const topKEmbeddings: [number, number][] = embeddingVectors.map((embedding, i) => [
    euclideanDistance(embedding, queryVector),
    i
  ]);
  return topKEmbeddings
    .sort(([a], [b]) => (closerFirst ? ascendCompareFn(a, b) : descendCompareFn(a, b)))
    .slice(0, selectTopCounter)
    .map(([v, i]) => [i, v]);
};

/**
 * provide more balance between relevance and diversity in information retrieval
 * @param threshold [0, 1], ~1 means more relevance and ~0 stresses more diversity
 */
export const selectTopKMMRWithCosine = (
  queryVector: number[],
  embeddingVectors: number[][],
  selectTopCounter: number,
  threshold: number = 0.5
) => {
  const simVals: [number, number][] = embeddingVectors.map((embedding, i) => [
    cosineSimilarity(embedding, queryVector),
    i
  ]);
  const selected: [score: number, index: number][] = [];
  while (selected.length < selectTopCounter) {
    const mmrScores: [number, number][] = [];
    const selectedIndexes = selected.map(([_, idx]) => idx);
    for (const [simVal, i] of simVals) {
      if (!selectedIndexes.includes(i)) {
        let maxSimInSelected = 0;
        for (const [_, selectedIdx] of selected) {
          const embedSimV = cosineSimilarity(
            embeddingVectors[selectedIdx],
            embeddingVectors[i]
          );
          maxSimInSelected = max(embedSimV, maxSimInSelected);
        }
        const mmrScore = threshold * simVal - (1 - threshold) * maxSimInSelected;
        mmrScores.push([mmrScore, i]);
      }
    }
    const maxEntry = mmrScores.reduceRight((prev, current) =>
      maxBy(([score]) => score, prev, current)
    );
    selected.push(maxEntry);
  }
  return selected;
};
