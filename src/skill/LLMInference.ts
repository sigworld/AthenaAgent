import needle from "needle";
import { logOf } from "../util/logger";
import {
  isCompletionChoiceEmpty,
  isNilEmpty,
  notEmpty,
  notNilEmpty,
  pickEmbeddingData,
  pickFirstChatCompletionStreamChoice,
  pickFirstFinishReason
} from "../util/puref";
import { getLLMConfig } from "../util/secrets";

const logger = logOf("LLMInference");

export async function* fetchLLMCompletion(
  model: LLMInstructType,
  prompt: PromptMessage,
  maxTokens = 24,
  stream: boolean = true,
  stop: PromptMessage = null
) {
  const modelConfig = getLLMConfig(model);
  const request = needle.post(
    modelConfig.url,
    {
      prompt,
      stream,
      top_p: 0.2,
      max_tokens: maxTokens,
      stop
    },
    {
      json: true,
      headers: {
        "api-key": modelConfig.apiKey
      },
      content_type: "application/json"
    }
  );
  const DATA_MARKER = "data: ";
  const DONE_MARKER = "[DONE]";
  const NORMAL_FINISH_MARKER = "stop";
  let partialData = "";
  for await (const chunk of request) {
    /* non-stream mode waits for only one complete chunk */
    if (!stream) {
      yield chunk;
      break;
    }
    const dataSet = (chunk + "").split(DATA_MARKER).filter(notEmpty);
    if (dataSet.length && dataSet[0]?.endsWith("\n\n") && notEmpty(partialData)) {
      dataSet[0] = partialData + dataSet[0];
      partialData = "";
    }
    for (const data of dataSet) {
      // valid data chunk
      if (data.startsWith("{") && data.endsWith("\n\n")) {
        try {
          const yieldCandidate = JSON.parse(data.slice(0, -2));
          if (isCompletionChoiceEmpty(yieldCandidate)) continue; // skip initial empty data

          yield yieldCandidate;

          const finishCause = pickFirstFinishReason(yieldCandidate);
          if (notNilEmpty(finishCause)) {
            // abnormal end
            if (finishCause != NORMAL_FINISH_MARKER) {
              logger.warn("llm stopped generation because: %s", finishCause as string);
            }
          }
        } catch (error) {
          logger.error("failed to parse data: %s: %s", data, error);
          throw error;
        }
      } else if (data != DONE_MARKER) {
        // cache partial data chunk
        partialData = data;
      }
    }
  }
}

export async function* fetchLLMChatCompletion(
  model: LLMType,
  prompt: ConversationMessage[],
  stream: boolean = true,
  jsonMode: boolean = false
) {
  const modelConfig = getLLMConfig(model);

  const requestBody = {
    messages: prompt,
    stream,
    top_p: 0.2
  };

  if (model === "GPT4_T" || model === "GPT3_5_T") {
    Object.assign(requestBody, {
      response_format: { type: jsonMode ? "json_object" : "text" }
    });
  }

  const request = needle.post(modelConfig.url, requestBody, {
    json: true,
    headers: {
      "api-key": modelConfig.apiKey
    },
    content_type: "application/json"
  });
  const DATA_MARKER = "data: ";
  const DONE_MARKER = "[DONE]";
  const NORMAL_FINISH_MARKER = "stop";
  let partialData = "";
  // assuming all requests will succeed
  for await (const chunk of request) {
    /* non-stream mode waits for only one complete chunk */
    if (!stream) {
      yield chunk;
      break;
    }
    const dataSet = (chunk + "").split(DATA_MARKER).filter(notEmpty);
    if (dataSet.length && dataSet[0]?.endsWith("\n\n") && notEmpty(partialData)) {
      dataSet[0] = partialData + dataSet[0];
      partialData = "";
    }
    for (const data of dataSet) {
      // valid data chunk
      if (data.startsWith("{") && data.endsWith("\n\n")) {
        try {
          const yieldCandidate = JSON.parse(data.slice(0, -2));
          if (isCompletionChoiceEmpty(yieldCandidate)) continue; // skip initial empty data

          yield yieldCandidate;

          // data chunk end
          const finishCause = pickFirstFinishReason(yieldCandidate);
          if (notNilEmpty(finishCause)) {
            // abnormal end
            if (finishCause != NORMAL_FINISH_MARKER) {
              logger.warn("llm stopped generation because: %s", finishCause as string);
            }
          }
        } catch (error) {
          logger.error("failed to parse data: %s: %s", data, error);
          throw error;
        }
      } else if (data != DONE_MARKER) {
        // cache partial data chunk
        partialData = data;
      }
    }
  }
}

export async function* fetchLLMChatCompletionWithTools(
  model: LLMType,
  prompt: ConversationMessage[],
  tools: ChatCompletionTool[],
  toolChoice: ChatCompletionToolChoice = "auto"
) {
  const modelConfig = getLLMConfig(model);
  const request = needle.post(
    modelConfig.url,
    {
      messages: prompt,
      top_p: 0.2,
      tools,
      tool_choice: toolChoice
      // stream: true // TODO: support stream tool_call of functions when needed
    },
    {
      json: true,
      headers: {
        "api-key": modelConfig.apiKey
      },
      content_type: "application/json"
    }
  );

  for await (const chunk of request) {
    /* non-stream mode waits for only one complete chunk */
    yield chunk;
    break;
  }
}

/**
 * fetches the LLM Embedding of the provided input.
 *
 * @async
 * @export
 * @param {string | string[]} input - The input information to get the LLM Embedding.
 *  It can be either a single string or an array of strings.
 *  The maximum length of input text for latest embedding models is 8192 tokens.
 *  Verify that inputs don't exceed this limit before making a request.
 * @reference https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/embeddings?tabs=console#verify-inputs-dont-exceed-the-maximum-length
 * @returns {Promise<number[][] | undefined>} A promise that resolves to the LLM Embedding as a 2D number array.
 *  If there are any issues in fetching, it would resolve to undefined.
 */
export async function fetchLLMEmbedding(
  input: string | string[]
): Promise<number[][] | undefined> {
  const modelConfig = getLLMConfig("ADA2");
  const response = await needle(
    "post",
    modelConfig.url,
    {
      input
    },
    {
      json: true,
      headers: {
        "api-key": modelConfig.apiKey
      },
      content_type: "application/json"
    }
  );
  if (response.statusCode === 200) {
    return pickEmbeddingData(response.body);
  } else {
    logger.error("failed to get embedding: [%s]%s", response.statusCode, response.body);
    return;
  }
}

export async function* splitTextIntoSemanticSegments(
  model: LLMType,
  {
    input,
    customPrompt,
    separator = "\n"
  }: { input: string; customPrompt?: string; separator?: string },
  stream: boolean = false
) {
  const completion = fetchLLMChatCompletion(
    model,
    [
      {
        role: "system",
        content:
          (customPrompt ||
            `Split the following text into semantic segments, for embedding storage and search purpose. Make sure each segment has a standalone context. `) +
          `Respond in the following format: segment${separator}segment`
      },
      {
        role: "user",
        content: input
      }
    ],
    stream
  );

  let sentenceSegment = "";
  for await (const delta of completion) {
    const token = pickFirstChatCompletionStreamChoice(delta) as string;
    if (isNilEmpty(token)) continue;

    const splitIndex = token.indexOf(separator);
    if (splitIndex > -1) {
      yield sentenceSegment + token.slice(0, splitIndex);
      sentenceSegment = "";
    } else {
      sentenceSegment += token;
    }
  }
  if (notNilEmpty(sentenceSegment)) yield sentenceSegment;
}
