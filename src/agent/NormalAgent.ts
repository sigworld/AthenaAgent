import CacheMemory from "../memory/CacheMemory";
import SkillSet from "../skill/SkillSet";
import { logOf } from "../util/logger";
import {
  isNilEmpty,
  notEmpty,
  pickFirstChatCompletionChoice,
  pickFirstChatCompletionStreamChoice,
  sleep
} from "../util/puref";
import DumbAgent from "./DumbAgent";

const logger = logOf("NormalAgent");

export default class NormalAgent extends DumbAgent {
  constructor(model: LLMType, ...interpreters: Interpreter[]) {
    super(model);
    this.memory = new CacheMemory();
    this.provideIntepreters(...interpreters);
  }

  static default() {}

  noStream(): NormalAgent {
    this.streamResponse = false;
    return this;
  }

  showInternalInference(): NormalAgent {
    this.shouldHideInternalInference = false;
    return this;
  }

  async run(userInput: string, outputAggregator: TokenAggregator): Promise<void> {
    this.setRunning();

    const shouldStop = await this._parseInput(userInput, outputAggregator);
    if (shouldStop) {
      this.stopRunning();
      return;
    }

    let interpretionCount = 0,
      parsingCount = 0;
    while (this.isRunning()) {
      const messages = this._getLLMMessages();

      await sleep(parsingCount * 500 * (this.model === "GPT4_T" ? 3 : 1));
      const anyInterpreterParsed = this.streamResponse
        ? await this._parseStreamOutput(messages, outputAggregator)
        : await this._parseOutput(messages, outputAggregator);
      parsingCount++;
      if (anyInterpreterParsed) {
        interpretionCount++;
      } else {
        if (interpretionCount > 0) {
          this.stopRunning();
        } else if (interpretionCount === 0 && parsingCount > 1) {
          logger.warn("interpreter not working correctly, check if LLMInference works");
          this.stopRunning();
        }
      }
    }

    logger.trace(
      "conversation:\n%s",
      this.memory
        .getAllMessage()
        .map((cm) => `${cm.role}: ${cm.content}`)
        .join("\n")
    );
  }
  private async _parseStreamOutput(
    messages: ConversationMessage[],
    outputAggregator: TokenAggregator
  ) {
    let result = "";
    let parsedOutput = "";

    let parsingInterpreter: Interpreter;
    let interpreterParsingStage = 0;
    const cachedTokens: string[] = [];
    let inferenceRetries = 2;
    while (inferenceRetries-- > 0) {
      for await (const deltaResponse of SkillSet.fetchLLMChatCompletion(
        this.model,
        messages,
        true
      )) {
        const token = pickFirstChatCompletionStreamChoice(deltaResponse) as string;
        if (isNilEmpty(token)) continue; // for azure openai api, first streamed message is role: assistant

        result += token;
        if (this.shouldHideInternalInference) {
          // find match interpreters to handle the tokens
          if (interpreterParsingStage === 0) {
            let tokenLengthToDeductFromCache = 0;
            const intprtIndex = this.interpreters.findIndex((intprt) => {
              // match an interpreter to start parsing
              const [prefixMatches, matchedStr] = intprt.outputStartMatches(result);
              if (prefixMatches) {
                tokenLengthToDeductFromCache = matchedStr.length;
                return true;
              }
              return false;
            });
            if (intprtIndex > -1) {
              interpreterParsingStage++;
              cachedTokens.push(token);
              parsingInterpreter = this.interpreters[intprtIndex];

              while (tokenLengthToDeductFromCache > 0) {
                // remove matched part from cached tokens
                tokenLengthToDeductFromCache -= cachedTokens.at(-1).length;
                cachedTokens.pop();
              }
              while (cachedTokens.length > 0) {
                // emit unmatched cached tokens
                outputAggregator.more(cachedTokens.shift());
              }
            }

            if (interpreterParsingStage === 0) {
              cachedTokens.push(token);
              if (cachedTokens.length > 5) {
                // when cached tokens are more than 5  TODO: but why?
                outputAggregator.more(cachedTokens.shift());
              }
            }
          }
        } else {
          outputAggregator.more(token);
        }

        const matchedInterpreter =
          parsingInterpreter && parsingInterpreter.outputMatches(result)
            ? parsingInterpreter
            : this.interpreters.find((intprt) => intprt.outputMatches(result));
        if (matchedInterpreter) {
          // assuming only one effective interpreter for a message
          interpreterParsingStage++;
          parsedOutput = await matchedInterpreter.parseOutput(result);
          if (this.shouldHideInternalInference) {
            const matchTrailing = matchedInterpreter.extractOutputMatchTrailing(result);
            outputAggregator.more(matchTrailing);
          } else {
            outputAggregator.more(parsedOutput);
          }

          // already got what we want, dump the rest tokens
          break;
        }
      }
      while (cachedTokens.length > 0) {
        // clear cached tokens
        outputAggregator.more(cachedTokens.shift());
      }
      if (isNilEmpty(result)) {
        logger.warn(
          "[StreamMode] LLMInference gives nothing, try again. %s retries left",
          inferenceRetries
        );
        await sleep(2500);
        continue;
      } else break;
    }

    this.memory.appendMessage("assistant", result);
    if (notEmpty(parsedOutput)) {
      this.memory.appendMessage("user", parsedOutput);
    }
    return interpreterParsingStage > 0;
  }

  private async _parseOutput(
    messages: ConversationMessage[],
    outputAggregator: TokenAggregator
  ): Promise<boolean> {
    let result = "",
      parsedOutput = "";

    let interpreterParsingStage = 0;

    let inferenceRetries = 2;
    while (inferenceRetries-- > 0) {
      for await (const deltaResponse of SkillSet.fetchLLMChatCompletion(
        this.model,
        messages,
        false
      )) {
        result = pickFirstChatCompletionChoice(deltaResponse) as string;
        if (isNilEmpty(result)) {
          logger.warn("something's wrong, api responded nothing!");
          return interpreterParsingStage > 0;
        }

        if (!this.shouldHideInternalInference) {
          outputAggregator.more(result);
        }

        const matchedInterpreter = this.interpreters.find((intprt) =>
          intprt.outputMatches(result)
        );
        if (matchedInterpreter) {
          // assume one effective interpreter for a message
          interpreterParsingStage++;
          parsedOutput = await matchedInterpreter.parseOutput(result);
          if (this.shouldHideInternalInference) {
            const matchTrailing = matchedInterpreter.extractOutputMatchTrailing(result);
            outputAggregator.more(matchTrailing);
          } else {
            outputAggregator.more(parsedOutput);
          }

          result += parsedOutput;
          break;
        }
      }
      if (interpreterParsingStage === 0 && this.shouldHideInternalInference) {
        outputAggregator.more(result);
      }
      if (isNilEmpty(result)) {
        logger.warn(
          "[NoStreamMode] LLMInference gives nothing, try again. %s retries left",
          inferenceRetries
        );
        await sleep(2500);
        continue;
      } else break;
    }

    this.memory.appendMessage("assistant", result);
    if (notEmpty(parsedOutput)) {
      this.memory.appendMessage("user", parsedOutput);
    }
    return interpreterParsingStage > 0;
  }

  private _getLLMMessages() {
    const allMessages = this.memory.getAllMessage();
    const messages = SkillSet.cutMessages(allMessages, 3000);
    const systemPrompt = this.interpreters
      .map((interpreter) => interpreter.sysPrompt())
      .join("\n");
    messages.unshift({ role: "system", content: systemPrompt });
    return messages;
  }

  private async _parseInput(
    input: string,
    outputAggregator: TokenAggregator
  ): Promise<boolean> {
    this.memory.addMessage("user", input);
    const interpreter = this.interpreters.find((intprt) => intprt.inputMatches(input));
    if (interpreter) {
      logger.info("interpreter: %s", interpreter.constructor.name);
      const [parsedInput, shouldStopInterpreting] = interpreter.parseInput(input);
      if (shouldStopInterpreting) {
        outputAggregator.more(parsedInput);
        return true;
      }
    }
    return false;
  }
}
