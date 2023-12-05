// TODO: save memory into a local file

export default class FileMemory implements AgentMemory {
  private messages: [ConversationMessage?] = [];
  constructor() {
    // TODO: persist in an interval
  }

  addMessage(role: ConversationRole, content: string) {
    this.messages.push({ role, content });
  }

  appendMessage(role: ConversationRole, content: string) {
    if (this.messages.at(-1)?.role === role) {
      this.messages.at(-1).content += `\n${content}`;
    } else this.messages.push({ role, content });
  }

  getAllMessage(): ConversationMessage[] {
    return [...this.messages];
  }
}
