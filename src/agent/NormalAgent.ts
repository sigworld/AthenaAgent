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

    let shouldStop = await this._parseInput(userInput, outputAggregator);
    if (shouldStop) {
      this.stopRunning();
      return;
    }

    while (this.isRunning()) {
      const messages = this._getLLMMessages();

      shouldStop = await this._parseOutput(messages, outputAggregator);
      if (shouldStop) break;
    }
    this.stopRunning();
  }

  private async _parseOutput(
    messages: ConversationMessage[],
    outputAggregator: TokenAggregator
  ): Promise<boolean> {
    let result = "";

    let parsingInterpreter: Interpreter;
    let isInterpreterParsing = false;
    const cachedTokens: string[] = [];
    for await (const deltaResponse of SkillSet.fetchLLMCompletion(this.model, messages, true)) {
      const token = pickFirstCompletionStreamChoice(deltaResponse) as string;
      if (isNilEmpty(token)) continue; // for azure openai, first streamed message is role: assistant

      result += token;
      cachedTokens.push(token);
      if (this.shouldHideInternalInference) {
        // find match interpreters to handle the tokens
        if (!isInterpreterParsing) {
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
            isInterpreterParsing = true;
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

          // if (!isInterpreterParsing) {
          if (cachedTokens.length > 5) {
            // when cached tokens are more than 5  TODO: but why?
            outputAggregator.more(cachedTokens.shift());
          }
          // }
        }
      } else {
        outputAggregator.more(token);
      }

      // const interpreter = parsingInterpreter; // && parsingInterpreter.outputMatches(result);
      // this.interpreters.find((intprt) => intprt.outputMatches(result));
      if (parsingInterpreter && parsingInterpreter.outputMatches(result)) {
        const [parsedOutput, shouldStopInterpreting] =
          await parsingInterpreter.parseOutput(result);
        if (this.shouldHideInternalInference) {
          const [suffixMatches, matchedStr] = parsingInterpreter.outputEndMatches(result);
          if (suffixMatches) outputAggregator.more(matchedStr);
        }
        if (!this.shouldHideInternalInference || shouldStopInterpreting) {
          outputAggregator.more(parsedOutput);
        }
        result += "\n" + parsedOutput + "\n";
        if (shouldStopInterpreting) {
          this.memory.appendMessage("assistant", result);
          return true;
        }
      }
    }

    // TODO: clear cached tokens
    logger.debug("are there cached tokens left? %s", cachedTokens.length);
    this.memory.appendMessage("assistant", result);
    return false;
  }

  private _getLLMMessages() {
    const allMessages = this.memory.getAllMessage();
    const messages = SkillSet.cutMessages(allMessages, 3000);
    const systemPrompt = this.interpreters
      .map((interpreter) => interpreter.sysPrompt())
      .join("\n\n");
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
