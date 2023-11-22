import * as LLMInferenceSkill from "./LLMInference";
import * as LLMTokenCounterSkill from "./LLMTokenCounter";
import * as WebSearchSkill from "./WebSearch";

export default {
  ...LLMInferenceSkill,
  ...LLMTokenCounterSkill,
  ...WebSearchSkill
};
