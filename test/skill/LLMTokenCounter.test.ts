import { expect, test } from "vitest";
import SkillSet from "../../src/skill/SkillSet";

test("LLM TikToken Count", () => {
  const len = SkillSet.tikTokenLength(
    `SECTION 1. SHORT TITLE. This Act may be cited as the "National Science Education Tax Incentive for Businesses Act of  2007". SEC. 2. CREDITS FOR CERTAIN CONTRIBUTIONS BENEFITING SC`
  );
  expect(len).toBe(49);
});

test("LLM Conversation Message Token Count", () => {
  const conversations: ConversationMessage[] = [
    {
      role: "user",
      content: `SECTION 1. SHORT TITLE. This Act may be cited as the "National Science Education Tax Incentive for Businesses Act of  2007". SEC. 2. CREDITS FOR CERTAIN CONTRIBUTIONS BENEFITING SC`
    }
  ];
  expect(SkillSet.conversationTokenCount(conversations)).toBe(56);
});
