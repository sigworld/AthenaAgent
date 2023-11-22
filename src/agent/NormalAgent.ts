import CacheMemory from "../memory/CacheMemory";
import SkillSet from "../skill/SkillSet";
import { logOf } from "../util/logger";
import { isNilEmpty, pickFirstCompletionStreamChoice } from "../util/puref";
import DumbAgent from "./DumbAgent";

const logger = logOf("NormalAgent");

export default class NormalAgent extends DumbAgent {
  constructor(model: LLMType, ...interpreters: Interpreter[]) {
    super(model);
    this.memory = new CacheMemory();
    this.provideIntepreters(...interpreters);
  }

  static default() {}

  async run(userInput: string, outputAggregator: TokenAggregator): Promise<void> {
    this.setRunning();

    const shouldStop = await this._parseInput(userInput, outputAggregator);
    if (shouldStop) {
      this.stopRunning();
      return;
    }

    let interpretionCount = 0;
    while (this.isRunning()) {
      const messages = this._getLLMMessages();

      const anyInterpreterParsed = await this._parseOutput(messages, outputAggregator);
      if (anyInterpreterParsed) {
        interpretionCount++;
      } else {
        if (interpretionCount > 0) {
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

  private async _parseOutput(
    messages: ConversationMessage[],
    outputAggregator: TokenAggregator
  ): Promise<boolean> {
    let result = "";

    let parsingInterpreter: Interpreter;
    let interpreterParsingStage = 0;
    const cachedTokens: string[] = [];
    for await (const deltaResponse of SkillSet.fetchLLMCompletion(this.model, messages, true)) {
      const token = pickFirstCompletionStreamChoice(deltaResponse) as string;
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
        // assume one effective interpreter for a message
        interpreterParsingStage++;
        const parsedOutput = await matchedInterpreter.parseOutput(result);
        if (this.shouldHideInternalInference) {
          const matchTrailing = matchedInterpreter.extractOutputMatchTrailing(result);
          outputAggregator.more(matchTrailing);
        } else {
          outputAggregator.more(parsedOutput);
        }

        result += parsedOutput;

        // already got what we want, dump the rest tokens
        break;
      }
    }

    while (cachedTokens.length > 0) {
      // clear cached tokens
      outputAggregator.more(cachedTokens.shift());
    }

    this.memory.appendMessage("assistant", result);
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
