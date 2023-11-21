import os from "os";
import DumbInterpreter from "./DumbInterpreter";

const SYS_PROMPT_TEMPLATE = `
Now: ${new Date().toString()}
You are an intelligent agent, running on a ${os.version()} ver.${os.release()} computer, to help the user solve problems.
Remember, you have full control (administrative-level/root-level) over the computer and can access the internet.
You can use these skills to help solve problems directly without explaination, or asking for permission:
`;

export default class BaseInterpreter extends DumbInterpreter {
  sysPrompt(): string {
    return SYS_PROMPT_TEMPLATE;
  }
}
