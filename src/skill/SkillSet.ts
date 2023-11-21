import { fetchLLMCompletion } from "./LLMInference";
import { cutMessages } from "./LLMTokenCounter";
import { scrapeWeb } from "./WebSearch";

export default {
  cutMessages,
  fetchLLMCompletion,
  scrapeWeb
};
