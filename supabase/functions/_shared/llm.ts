/** OpenAI-compatible chat (Moonshot / OpenAI / Lovable). Priority: Moonshot → OpenAI → Lovable */

const MOONSHOT_ENDPOINTS = [
  "https://api.moonshot.cn/v1",
  "https://api.moonshot.ai/v1",
] as const;

function env(...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = Deno.env.get(key);
    if (value?.trim()) return value.trim();
  }
  return undefined;
}

export type LlmConfig = {
  apiKey: string;
  baseUrl: string;
  model: string;
  visionModel: string;
  provider: "moonshot" | "openai" | "lovable";
};

export function resolveLlm(): LlmConfig {
  const moonshot = env("moonshot_api_key", "MOONSHOT_API_KEY");
  if (moonshot) {
    const configured = env("moonshot_base_url", "MOONSHOT_BASE_URL");
    const baseUrl = (configured ?? MOONSHOT_ENDPOINTS[0]).replace(/\/$/, "");
    return {
      apiKey: moonshot,
      baseUrl,
      model: env("moonshot_model", "MOONSHOT_MODEL") ?? "moonshot-v1-8k",
      visionModel: env("moonshot_vision_model", "MOONSHOT_VISION_MODEL") ?? "moonshot-v1-8k-vision-preview",
      provider: "moonshot",
    };
  }

  const openai = env("OPENAI_API_KEY", "openai_api_key");
  if (openai) {
    return {
      apiKey: openai,
      baseUrl: (env("OPENAI_BASE_URL", "openai_base_url") ?? "https://api.openai.com/v1").replace(/\/$/, ""),
      model: env("OPENAI_MODEL", "openai_model") ?? "gpt-4o-mini",
      visionModel: env("OPENAI_VISION_MODEL", "openai_vision_model") ?? "gpt-4o-mini",
      provider: "openai",
    };
  }

  const lovable = env("LOVABLE_API_KEY", "lovable_api_key");
  if (lovable) {
    return {
      apiKey: lovable,
      baseUrl: "https://ai.gateway.lovable.dev/v1",
      model: "google/gemini-2.5-flash",
      visionModel: "google/gemini-2.5-flash",
      provider: "lovable",
    };
  }

  throw new Error(
    "AI not configured. Set moonshot_api_key in Supabase secrets, then run: npm run secrets:sync",
  );
}

function moonshotFallbackBases(baseUrl: string): string[] {
  const ordered = baseUrl.includes(".cn")
    ? [...MOONSHOT_ENDPOINTS]
    : [...MOONSHOT_ENDPOINTS].reverse();
  return [...new Set(ordered)];
}

async function postChatCompletion(
  baseUrl: string,
  apiKey: string,
  body: Record<string, unknown>,
): Promise<Response> {
  return fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

async function chatCompletion(body: Record<string, unknown>): Promise<Response> {
  const cfg = resolveLlm();
  const bases = cfg.provider === "moonshot" ? moonshotFallbackBases(cfg.baseUrl) : [cfg.baseUrl];

  let lastResponse: Response | null = null;
  let lastRaw = "";

  for (const baseUrl of bases) {
    const response = await postChatCompletion(baseUrl, cfg.apiKey, body);
    lastResponse = response;
    lastRaw = await response.text();

    if (response.ok) {
      return new Response(lastRaw, { status: response.status, headers: response.headers });
    }

    // Only retry Moonshot across CN / international endpoints on auth failures.
    if (cfg.provider !== "moonshot" || response.status !== 401 || baseUrl === bases.at(-1)) {
      break;
    }
    console.warn(`Moonshot auth failed on ${baseUrl}, trying alternate endpoint`);
  }

  return new Response(lastRaw, {
    status: lastResponse?.status ?? 500,
    headers: lastResponse?.headers,
  });
}

function parseApiErrorMessage(raw: string): string {
  try {
    const parsed = JSON.parse(raw) as { error?: { message?: string }; message?: string };
    return parsed.error?.message || parsed.message || raw.slice(0, 240);
  } catch {
    return raw.slice(0, 240);
  }
}

function handleLlmErrors(response: Response, raw: string, cfg: LlmConfig): never {
  const detail = parseApiErrorMessage(raw);
  if (response.status === 429) throw new Error("AI rate limit — try again in a moment");
  if (response.status === 402 || response.status === 401) {
    const hint = cfg.provider === "moonshot"
      ? "Use a key from platform.moonshot.cn with api.moonshot.cn/v1, or platform.moonshot.ai with api.moonshot.ai/v1. Run: npm run secrets:sync"
      : "Check the API key in Supabase secrets";
    throw new Error(`AI API key invalid or out of credits (${response.status}). ${hint}`);
  }
  console.error("LLM error", response.status, raw);
  throw new Error(`AI request failed (${response.status}): ${detail}`);
}

async function readChatJson(response: Response, cfg: LlmConfig): Promise<Record<string, unknown>> {
  const raw = await response.text();
  if (!response.ok) handleLlmErrors(response, raw, cfg);
  return JSON.parse(raw) as Record<string, unknown>;
}

function parseToolJson<T>(raw: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    const cleaned = raw
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, " ")
      .replace(/,\s*([}\]])/g, "$1");
    return JSON.parse(cleaned) as T;
  }
}

export async function callToolCompletion<T>(
  systemPrompt: string,
  userContent: unknown,
  toolName: string,
  toolDescription: string,
  parameters: Record<string, unknown>,
  options?: { vision?: boolean; maxTokens?: number; temperature?: number },
): Promise<T> {
  const cfg = resolveLlm();
  const model = options?.vision ? cfg.visionModel : cfg.model;

  const response = await chatCompletion({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
    tools: [{
      type: "function",
      function: { name: toolName, description: toolDescription, parameters },
    }],
    tool_choice: { type: "function", function: { name: toolName } },
    ...(options?.maxTokens ? { max_tokens: options.maxTokens } : {}),
    ...(options?.temperature != null ? { temperature: options.temperature } : {}),
  });

  const data = await readChatJson(response, cfg);
  const message = (data.choices as { message?: { tool_calls?: { function?: { arguments?: string } }[]; content?: string } }[] | undefined)?.[0]
    ?.message;
  const toolArgs = message?.tool_calls?.[0]?.function?.arguments;
  if (toolArgs) return parseToolJson<T>(toolArgs);

  const content = message?.content?.trim();
  if (content) {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]) as T;
      } catch { /* fall through */ }
    }
  }

  throw new Error("AI did not return structured output");
}

export async function callTextCompletion(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 400,
): Promise<string> {
  const cfg = resolveLlm();
  const response = await chatCompletion({
    model: cfg.model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    max_tokens: maxTokens,
  });

  const data = await readChatJson(response, cfg);
  const text = (data.choices as { message?: { content?: string } }[] | undefined)?.[0]?.message?.content?.trim() ?? "";
  return text.replace(/^["']|["']$/g, "");
}
