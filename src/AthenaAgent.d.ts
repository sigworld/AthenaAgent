type AnyFunction =
  | ((...args: unknown[]) => unknown)
  | ((...args: unknown[]) => Promise<unknown>);

interface Interpreter {
  sysPrompt(customPrompt?: string): string;
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

type FileIOSupportedFileTypes = "TEXT";
type FileIOFileWriteMode = "overwrite" | "append";

interface TokenAggregator {
  more(res: unknown): void;
  get(): unknown;
  tokenArray(): unknown[];
}

type LLMInferenceConfig = {
  stream?: boolean;
  requireJson?: boolean;
};

type LLMType = "GPT3_5" | "GPT3_5_T" | "GPT4" | "GPT4_T";

type LLMInstructType = "GPT3_5_I"; // GPT3.5-Instruct

type LLMEmbeddingType = "ADA2"; // text-embedding-ada-002

type LLMConfig = {
  url: string;
  apiKey: string;
};

type ConversationRole = "user" | "assistant" | "system" | "tool";

type ConversationMessage = { role: ConversationRole; content: string };

type PromptMessage = string | string[];

/**
 * Currently, only `function` is supported on Azure, OpenAI supports `code_interpreter`, `retrieval`, `
 */
type ChatCompletionToolType = "function";

/**
 * @reference https://github.com/Azure/azure-rest-api-specs/blob/main/specification/cognitiveservices/data-plane/AzureOpenAI/inference/preview/2023-12-01-preview/inference.json
 */
type ChatCompletionTool = {
  /**
   * The type of the tool.
   */
  type: ChatCompletionToolType;

  function: {
    /**
     * The name of the function to be called. Must be a-z, A-Z, 0-9, or contain underscores and dashes, with a maximum length of 64."
     */
    name: string;

    /**
     * The description of what the function does.
     */
    description: string;

    /**
     * The parameters the functions accepts, described as a JSON Schema object.
     */
    parameters: JSONSchema7;
  };
};

type ChatCompletionToolChoice = "none" | "auto";

type ChatCompletionToolCall = {
  function: {
    name: string;
    arguments: string;
  };
  id: string;
  type: ChatCompletionToolType;
};

type EmbeddingDocument = {
  title: string;
  metadata: Record<string, unknown>;
  createtime: number;
  embeddings?: {
    hashes: string[];
    texts: string[];
    vectors: number[][];
    indexes: AugmentedDocumentIndex[];
  };
};

type AugmentedDocumentIndex = {
  prev: number[]; // indexes of prepending text
  next: number[]; // indexes of appending text
  similar: number[]; // indexes of similar text
};

type AugmentedEmbeddingText = {
  text: string;
  augmentedTexts?: {
    prev: string[];
    next: string[];
    similar: string[];
  };
};
