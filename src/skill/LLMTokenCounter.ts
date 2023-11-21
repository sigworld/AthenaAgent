export const cutMessages = (
  messages: ConversationMessage[],
  tokenLimit: number
): ConversationMessage[] => {
  while (countToken(messages) > tokenLimit) messages.shift();
  return messages;
};

/**
 * @reference: https://stackoverflow.com/questions/76216113/how-can-i-count-tokens-before-making-api-call
 */
const countToken = (messages: ConversationMessage[]): number => {
  // "#tokens <? #characters * (1/e) + safety_margin"; safety_margin = 2
  const [safetyMargin, startingLen] = messages.length > 0 ? [2, 3] : [0, 0];
  const characterCount = messages
    .map(({ content }) => content.length)
    .reduce((a, b) => a + b, messages.length > 0 ? startingLen : 0);
  return Math.ceil((characterCount * 1) / Math.E) + safetyMargin;
};
