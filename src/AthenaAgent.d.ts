type AnyFunction =
  | ((...args: unknown[]) => unknown)
  | ((...args: unknown[]) => Promise<unknown>);

interface Interpreter {
  sysPrompt(): string;
  inputMatches(input: string): boolean;
  outputMatches(output: string): boolean;
  outputStartMatches(output: string): [matches: boolean, matchedStr: string];
  extractOutputMatchTrailing(output: string): string;
  parseInput(input: string): string;
  parseOutput(output: string): Promise<string>;
}

interface SkillFunction<T> {
  (...args: unknown[]): T | Promise<T>;
  deps?: string[];
  callable?: boolean;
  description?: string;
}

interface TokenAggregator {
  more(res: unknown): void;
  get(): unknown;
  tokenArray(): unknown[];
}

type LLMInferenceConfig = {
  stream?: boolean;
  requireJson?: boolean;
};

type LLMType = "GPT3_5" | "GPT4";

type LLMInstructType = "GPT3_5_I"; // GPT3.5-Instruct

type LLMConfig = {
  url: string;
  apiKey: string;
};

type ConversationRole = "user" | "assistant" | "system";

type ConversationMessage = { role: ConversationRole; content: string };

type PromptMessage = string | string[];
