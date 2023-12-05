import os from "os";
import DumbInterpreter from "./DumbInterpreter";

const SYS_PROMPT_TEMPLATE = `
Now: ${new Date().toString()}
You are an intelligent agent, running on a ${os.version()} ver.${os.release()} computer, to help the user solve problems.
Remember, you have full control (administrative-level/root-level) over the computer and can access the internet with an automated executor.
The automated executor will help run programs you generate and feed outputs back to you via the user.
You can use these skills to help solve problems directly without explanation, or asking for permission:
`;

export default class BaseInterpreter extends DumbInterpreter {
  sysPrompt(customPrompt?: string): string {
    if (customPrompt || !this.interpreterPrompt) {
      this.interpreterPrompt = customPrompt || SYS_PROMPT_TEMPLATE;
    }
    return this.interpreterPrompt;
  }
}
