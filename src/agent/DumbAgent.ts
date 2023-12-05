export default abstract class DumbAgent {
  private continueYourWork = false;
  protected memory: AgentMemory;
  protected interpreters: Interpreter[];
  protected shouldHideInternalInference = true;
  protected streamResponse = true;
  protected model: LLMType = "GPT3_5";

  constructor(model: LLMType) {
    this.model = model;
  }

  protected setRunning() {
    this.continueYourWork = true;
  }

  protected stopRunning() {
    this.continueYourWork = false;
  }

  protected isRunning(): boolean {
    return this.continueYourWork;
  }

  stop(): void {
    this.stopRunning();
  }

  public provideIntepreters(...interpreters: Interpreter[]): void {
    this.interpreters = interpreters;
  }

  abstract run(userInput: string, outputAggregator: TokenAggregator): void;
}
