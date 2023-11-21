import R from "rambda";

export const notEmpty = R.compose(R.not, R.isEmpty);
export const isEmpty = R.isEmpty;
export const isNil = R.isNil;
export const notNil = R.isNil;
export const isNilEmpty = R.either(R.isNil, R.isEmpty);
export const notNilEmpty = R.compose(R.not, isNilEmpty);

/// GPT related pure functions
export const pickFirstCompletionChoice = R.path("choices.0.message.content");
export const pickFirstCompletionStreamChoice = R.path("choices.0.delta.content");
export const pickFirstFinishReason = R.path("choices.0.finish_reason");
export const pickFirstCompletionStreamRole = R.path("choices.0.delta.role");
export const isCompletionChoiceEmpty = R.compose(R.isEmpty, R.path("choices"));
