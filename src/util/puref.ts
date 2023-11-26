import R from "rambda";

export const notEmpty = R.compose(R.not, R.isEmpty);
export const isEmpty = R.isEmpty;
export const isNil = R.isNil;
export const notNil = R.isNil;
export const isNilEmpty = R.either(R.isNil, R.isEmpty);
export const notNilEmpty = R.compose(R.not, isNilEmpty);
export const prop = R.prop;

export const sleep = (timeout: number) =>
  new Promise<void>((resolve) => {
    setTimeout(() => resolve(), timeout);
  });

/// GPT related pure functions
export const pickFirstCompletionChoice = R.path("choices.0.text");
export const pickFirstChatCompletionChoiceTools = R.path("choices.0.message.tool_calls");
export const pickFirstChatCompletionChoiceContent = R.path("choices.0.message.content");
export const pickFirstChatCompletionStreamChoice = R.path("choices.0.delta.content");
export const pickFirstFinishReason = R.path("choices.0.finish_reason");
export const pickFirstChatCompletionStreamRole = R.path("choices.0.delta.role");
export const isCompletionChoiceEmpty = R.compose(R.isEmpty, R.path("choices"));
export const pickEmbeddingData = R.compose(R.map(R.prop("embedding")), R.prop("data"));
export const calcNorm = R.compose(
  Math.sqrt,
  R.reduce((prev: number, v: number) => prev + v ** 2, 0)
);

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
