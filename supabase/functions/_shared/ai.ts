import { callToolCompletion } from "./llm.ts";

/** @deprecated name kept for imports — uses Moonshot/OpenAI/Lovable via llm.ts */
export async function callLovableTool<T>(
  systemPrompt: string,
  userContent: unknown,
  toolName: string,
  toolDescription: string,
  parameters: Record<string, unknown>,
  options?: { vision?: boolean },
): Promise<T> {
  return callToolCompletion<T>(
    systemPrompt,
    userContent,
    toolName,
    toolDescription,
    parameters,
    options,
  );
}
