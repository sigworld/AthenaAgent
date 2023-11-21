export default class CacheMemory {
  private messages: [ConversationMessage?] = [];
  constructor() {}

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
