import { getEncoding } from "js-tiktoken";

export const cutMessages = (
  messages: ConversationMessage[],
  tokenLimit: number
): ConversationMessage[] => {
  while (conversationTokenCount(messages) > tokenLimit) messages.shift();
  return messages;
};

/**
 * a fast and aggresive token count estimation
 * @reference: https://stackoverflow.com/questions/76216113/how-can-i-count-tokens-before-making-api-call
 */
export const estimateTokenCount = (messages: ConversationMessage[]): number => {
  // "#tokens <? #characters * (1/e) + safety_margin"; safety_margin = 2
  const [safetyMargin, startingLen] = messages.length > 0 ? [2, 3] : [0, 0];
  const characterCount = messages
    .map(({ content }) => content.length)
    .reduce((a, b) => a + b, messages.length > 0 ? startingLen : 0);
  return Math.ceil((characterCount * 1) / Math.E) + safetyMargin;
};

/**
 * @reference a tiktoken visualizer https://tiktokenizer.vercel.app/
 * @param messages
 * @returns
 */
export const conversationTokenCount = (messages: ConversationMessage[]): number => {
  const len = messages.reduce((len, msg) => len + tikTokenLength(msg.content) + 4, 0); // 4: surrounding `<|im_start|>{role}\n<|im_end|>
  return len + 3; // trailing `\n<|im_start|>assistant`
};

export const tikTokenLength = (text: string): number => {
  const encoder = getEncoding("cl100k_base");
  const tokens = encoder.encode(text);
  return tokens.length;
};
