import needle from "needle";
import { logOf } from "../util/logger";
import {
  isCompletionChoiceEmpty,
  notEmpty,
  notNilEmpty,
  pickFirstFinishReason
} from "../util/puref";
import { getLLMConfig } from "../util/secrets";

const logger = logOf("LLMInference");

export async function* fetchLLMCompletion(
  model: LLMType,
  prompt: ConversationMessage[],
  stream: boolean = true
) {
  const modelConfig = getLLMConfig(model);
  const request = needle.post(
    modelConfig.url,
    {
      messages: prompt,
      stream,
      top_p: 0.7
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

          // data chunk end
          const finishCause = pickFirstFinishReason(yieldCandidate);
          if (notNilEmpty(finishCause)) {
            // abnormal end
            if (finishCause != NORMAL_FINISH_MARKER) {
              logger.warn("llm stopped generation because: %s", finishCause as string);
            }
            continue;
          } else yield yieldCandidate;
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
