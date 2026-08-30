// Minimal OpenAI Chat Completions client — zero-dependency, uses native fetch.
// Only reached when env.hasOpenAI is true. Tuned to spend as little as possible:
// cheap model, capped output, low temperature, and a per-call usage/cost log.
import { env } from "./env.ts";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// USD per 1M tokens. gpt-4o-mini is the cheap default; extend as needed.
const PRICING: Record<string, { in: number; out: number }> = {
  "gpt-4o-mini": { in: 0.15, out: 0.6 },
  "gpt-4o": { in: 2.5, out: 10 },
  "gpt-4.1-mini": { in: 0.4, out: 1.6 },
  "gpt-4.1-nano": { in: 0.1, out: 0.4 },
};

function logCost(model: string, usage: any) {
  if (!usage) return;
  const p = PRICING[model] ?? PRICING["gpt-4o-mini"];
  const cost = (usage.prompt_tokens * p.in + usage.completion_tokens * p.out) / 1_000_000;
  console.log(
    `[openai] ${model}  in=${usage.prompt_tokens} out=${usage.completion_tokens}  ≈ $${cost.toFixed(5)}`,
  );
}

/**
 * Calls OpenAI with JSON-mode enabled and returns the parsed object.
 * `maxTokens` caps output (the expensive side) so a run can't blow up.
 */
export async function chatJson<T>(
  messages: ChatMessage[],
  opts: { maxTokens?: number; temperature?: number } = {},
): Promise<T> {
  let res: Response;
  try {
    res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${env.openaiApiKey}`,
      },
      body: JSON.stringify({
        model: env.openaiModel,
        messages,
        temperature: opts.temperature ?? 0.4,
        max_tokens: opts.maxTokens ?? 1500,
        response_format: { type: "json_object" },
      }),
    });
  } catch (cause) {
    throw new Error("Could not reach OpenAI (network error).", { cause });
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`OpenAI request failed (${res.status}): ${detail.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string }; finish_reason?: string }[];
    usage?: { prompt_tokens: number; completion_tokens: number };
  };
  logCost(env.openaiModel, data.usage);

  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI returned no content.");
  if (data.choices?.[0]?.finish_reason === "length") {
    // Output was truncated by max_tokens — JSON may be incomplete.
    console.warn("[openai] output hit max_tokens; consider raising the cap for this call.");
  }

  try {
    return JSON.parse(content) as T;
  } catch (cause) {
    throw new Error("OpenAI returned invalid JSON.", { cause });
  }
}

/**
 * Vision + JSON mode: read an image (data URL or https URL) against a prompt and
 * return the parsed object. gpt-4o-mini is multimodal, so this stays cheap;
 * `detail: "low"` keeps the image token cost down.
 */
export async function chatVisionJson<T>(
  prompt: string,
  imageUrl: string,
  opts: { maxTokens?: number } = {},
): Promise<T> {
  let res: Response;
  try {
    res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${env.openaiApiKey}`,
      },
      body: JSON.stringify({
        model: env.openaiModel,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: imageUrl, detail: "low" } },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: opts.maxTokens ?? 900,
        response_format: { type: "json_object" },
      }),
    });
  } catch (cause) {
    throw new Error("Could not reach OpenAI (network error).", { cause });
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`OpenAI vision request failed (${res.status}): ${detail.slice(0, 300)}`);
  }
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
    usage?: { prompt_tokens: number; completion_tokens: number };
  };
  logCost(env.openaiModel, data.usage);
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI returned no content.");
  try {
    return JSON.parse(content) as T;
  } catch (cause) {
    throw new Error("OpenAI returned invalid JSON.", { cause });
  }
}
