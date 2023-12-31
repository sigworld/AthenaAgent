import assert from "assert";
import vm from "vm";
import { logOf } from "../util/logger";
import { isEmpty, notNilEmpty } from "../util/puref";
import DumbInterpreter from "./DumbInterpreter";

const logger = logOf("JSInterpreter");

const JS_FUNC_MARKER = "{js_funcs}";
const JS_MODULE_MARKER = "{js_modules}";

const JAVASCRIPT_SYS_TEMPLATE = `
# Run JavaScript
* format: \`\`\`js\n{code}\`\`\`
* {code} should be encapsulated within an IIFE function.
* The result of the IIFE should be directly returned, **NOT logged to the 'console'**. This is crucial for capturing the output in a Node.js VM environment.
* **Use async/await syntax for handling asynchronous functions or Promises. Avoid using .then() chaining.**
* **Problem is only Solved with: 1) fully runnable code; 2) complete feature implementation.**
* JavaScript runtime environment: ES2022, module mode not supported.
${JS_MODULE_MARKER}
${JS_FUNC_MARKER}
`;

// a JavaScript interpreter
export default class JavaScriptInterpreter extends DumbInterpreter {
  outputMatchPattern = "```js\n(.*?)\n```";
  outputMatchStartWithPattern = "```js\n";
  private functionTools: SkillFunction<unknown>[] = [];

  sysPrompt(customPrompt?: string): string {
    if (customPrompt || !this.interpreterPrompt) {
      const thePrompt = customPrompt
        ? `${customPrompt}\n${JS_MODULE_MARKER}\n${JS_FUNC_MARKER}`
        : JAVASCRIPT_SYS_TEMPLATE;
      const jsFuncsStr = this.functionTools
        .filter((tool) => tool.callable)
        .map((tool) => tool.description)
        .join("\n\n");

      let prompt = thePrompt.replace(
        JS_FUNC_MARKER,
        isEmpty(jsFuncsStr)
          ? ""
          : `* The following functions are available in global context (already implemented):
\`\`\`
${jsFuncsStr}
\`\`\`
`
      );

      const jsModulesStr = this.functionTools
        .filter((tool) => !tool.callable)
        .flatMap((tool) => tool.deps)
        .join(",");

      this.interpreterPrompt = prompt.replace(
        JS_MODULE_MARKER,
        isEmpty(jsModulesStr)
          ? ""
          : `* Available dependency modules in context: ${jsModulesStr}`
      );
    }

    return this.interpreterPrompt;
  }

  provideFunctionTool(...funcTools: SkillFunction<unknown>[]): JavaScriptInterpreter {
    for (const funcTool of funcTools) {
      this.functionTools.push(funcTool);
    }
    return this;
  }

  async parseOutput(output: string): Promise<string> {
    const matchArr = new RegExp(this.outputMatchPattern, "s").exec(output);
    assert(notNilEmpty(matchArr));
    try {
      const res = await this._execScript(matchArr[1]);
      return "\nJavaScript VM execution result: " + (res as string) + "\n";
    } catch (error) {
      logger.error("failed to run js script: %s\n%s", error, matchArr[1]);
      return `RUNTIME ERROR: ${error}`;
    }
  }

  async _execScript(scriptCode: string): Promise<unknown> {
    const script = new vm.Script(scriptCode);
    logger.debug("ready to run js script:\n%s", scriptCode);
    const sandbox: { [key: string]: unknown } = {
      console: console,
      require: require
    };
    for (const tool of this.functionTools) {
      if (tool.callable) sandbox[(tool as unknown as Function).name] = tool;
      else {
        for (const dep of tool.deps) {
          // add dependencies by `require` based on tool dependencies
          sandbox[dep] = require(dep);
        }
      }
    }
    const context = vm.createContext(sandbox);
    return await script.runInContext(context);
  }
}
