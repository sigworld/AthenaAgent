type AnyFunction =
  | ((...args: unknown[]) => unknown)
  | ((...args: unknown[]) => Promise<unknown>);

interface Interpreter {
  sysPrompt(): string;
  inputMatches(input: string): boolean;
  outputMatches(output: string): boolean;
  outputStartMatches(output: string): [matches: boolean, matchedStr: string];
  outputEndMatches(output: string): [matches: boolean, matchedStr: string];
  parseInput(input: string): [parsedInput: string, shouldStop: boolean];
  parseOutput(output: string): Promise<[parsedOutput: string, shouldStop: boolean]>;
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
  getAll(): unknown[];
}

type LLMInferenceConfig = {
  stream?: boolean;
  requireJson?: boolean;
};

type LLMType = "GPT3_5" | "GPT4";

type LLMConfig = {
  url: string;
  apiKey: string;
};

type ConversationRole = "user" | "assistant" | "system";

type ConversationMessage = { role: ConversationRole; content: string };
