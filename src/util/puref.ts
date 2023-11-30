import R from "rambda";

export const notEmpty = R.compose(R.not, R.isEmpty);
export const isEmpty = R.isEmpty;
export const isNil = R.isNil;
export const notNil = R.isNil;
export const isNilEmpty = R.either(R.isNil, R.isEmpty);
export const notNilEmpty = R.compose(R.not, isNilEmpty);
export const max = R.max;
export const maxBy = R.maxBy;
export const prop = R.prop;
export const equals = R.equals;
export const nth = R.nth;
export const ascendCompareFn = (a: number, b: number) => a - b;
export const decendCompareFn = (a: number, b: number) => b - a;

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
