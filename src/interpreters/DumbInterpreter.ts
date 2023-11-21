import { isNilEmpty, notNilEmpty } from "../util/puref";

export default abstract class DumbInterpreter implements Interpreter {
  protected inputMatchPattern = "";
  protected outputMatchPattern = "";
  protected outputMatchStartWithPattern = "";

  sysPrompt(): string {
    return "";
  }

  inputMatches(input: string): boolean {
    if (isNilEmpty(this.inputMatchPattern)) return false;

    return new RegExp(this.inputMatchPattern, "s").test(input);
  }

  outputMatches(output: string): boolean {
    if (isNilEmpty(this.outputMatchPattern)) return false;

    return new RegExp(this.outputMatchPattern, "s").test(output);
  }

  outputStartMatches(output: string): [matches: boolean, matchedStr: string] {
    if (isNilEmpty(this.outputMatchStartWithPattern)) return [false, ""];

    const matchArr = new RegExp(this.outputMatchStartWithPattern, "s").exec(output);
    if (notNilEmpty(matchArr)) {
      return [true, matchArr[0]];
    } else {
      return [false, ""];
    }
  }

  outputEndMatches(output: string): [matches: boolean, matchedStr: string] {
    if (isNilEmpty(this.outputMatchPattern)) return [false, ""];

    const matchArr = new RegExp(this.outputMatchPattern, "s").exec(output);
    if (notNilEmpty(matchArr)) {
      return [true, matchArr[0]];
    } else {
      return [false, ""];
    }
  }

  parseInput(input: string): [parsedInput: string, shouldStop: boolean] {
    return ["", false];
  }
  async parseOutput(output: string): Promise<[parsedOutput: string, shouldStop: boolean]> {
    return ["", false];
  }
}
