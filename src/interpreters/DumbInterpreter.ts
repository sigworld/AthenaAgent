import { isNilEmpty, notNilEmpty } from "../util/puref";

export default abstract class DumbInterpreter implements Interpreter {
  protected interpreterPrompt: string;
  protected inputMatchPattern = "";
  protected outputMatchPattern = "";
  protected outputMatchStartWithPattern = "";

  sysPrompt(customPrompt?: string): string {
    return customPrompt || "";
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

  extractOutputMatchTrailing(output: string): string {
    if (isNilEmpty(this.outputMatchPattern)) return "";

    const matchArr = new RegExp(this.outputMatchPattern, "s").exec(output);
    if (notNilEmpty(matchArr)) {
      return output.slice(output.indexOf(matchArr[0]) + matchArr[0].length);
    } else {
      return "";
    }
  }

  parseInput(input: string): string {
    return "";
  }

  async parseOutput(output: string): Promise<string> {
    return "";
  }
}
