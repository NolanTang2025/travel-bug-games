import { callTextCompletion } from "./llm.ts";

export async function generateSlackDraft(input: {
  systemPrompt: string;
  triggerText: string;
  channelContext?: string;
}): Promise<string> {
  return callTextCompletion(
    input.systemPrompt,
    `有人在 Slack 写道：\n"""${input.triggerText.slice(0, 2000)}"""\n\n${
      input.channelContext ? `上下文：${input.channelContext}\n\n` : ""
    }请起草一条我可以直接发送的回复。只输出正文，不要引号。`,
  );
}
