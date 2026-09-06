import { z } from "zod";
import { AiSchemaError, type AIProvider } from "./types";

/* ──────────────────────────────────────────────────────────────
   OpenAI-compatible adapter — also works against any endpoint
   speaking the /v1/chat/completions dialect (OpenRouter, Groq,
   Together, Ollama, LM Studio, ...) via AI_BASE_URL.
   ────────────────────────────────────────────────────────────── */
export class OpenAICompatibleProvider implements AIProvider {
  readonly id = "openai";

  available() {
    return Boolean(process.env.AI_API_KEY);
  }

  async complete(system: string, user: string, opts?: { temperature?: number; maxTokens?: number }): Promise<string> {
    const apiKey = process.env.AI_API_KEY;
    const baseUrl = (process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
    const model = process.env.AI_MODEL || "gpt-4o-mini";
    if (!apiKey) throw new Error("AI_API_KEY is not configured");

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: opts?.temperature ?? 0.5,
        max_tokens: opts?.maxTokens ?? 900,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`AI provider error ${res.status}: ${body.slice(0, 300)}`);
    }
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("AI provider returned an empty response");
    return content;
  }
}

/* ──────────────────────────────────────────────────────────────
   Anthropic adapter
   ────────────────────────────────────────────────────────────── */
export class AnthropicProvider implements AIProvider {
  readonly id = "anthropic";

  available() {
    return Boolean(process.env.AI_API_KEY);
  }

  async complete(system: string, user: string, opts?: { temperature?: number; maxTokens?: number }): Promise<string> {
    const apiKey = process.env.AI_API_KEY;
    const model = process.env.AI_MODEL || "claude-3-5-haiku-latest";
    if (!apiKey) throw new Error("AI_API_KEY is not configured");

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: opts?.maxTokens ?? 900,
        temperature: opts?.temperature ?? 0.5,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Anthropic error ${res.status}: ${body.slice(0, 300)}`);
    }
    const data = (await res.json()) as { content?: { text?: string }[] };
    const text = data.content?.map((c) => c.text ?? "").join("");
    if (!text) throw new Error("Anthropic returned an empty response");
    return text;
  }
}

/* ──────────────────────────────────────────────────────────────
   Google Gemini adapter
   ────────────────────────────────────────────────────────────── */
export class GeminiProvider implements AIProvider {
  readonly id = "gemini";

  available() {
    return Boolean(process.env.AI_API_KEY);
  }

  async complete(system: string, user: string, opts?: { temperature?: number; maxTokens?: number }): Promise<string> {
    const apiKey = process.env.AI_API_KEY;
    const model = process.env.AI_MODEL || "gemini-2.0-flash";
    if (!apiKey) throw new Error("AI_API_KEY is not configured");

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: user }] }],
          generationConfig: { temperature: opts?.temperature ?? 0.5, maxOutputTokens: opts?.maxTokens ?? 900 },
        }),
      },
    );
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Gemini error ${res.status}: ${body.slice(0, 300)}`);
    }
    const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("");
    if (!text) throw new Error("Gemini returned an empty response");
    return text;
  }
}

/* ──────────────────────────────────────────────────────────────
   Reply helper: ask an LLM for a JSON object, then validate it.
   Never trusts the model — anything malformed is surfaced, not
   silently applied.
   ────────────────────────────────────────────────────────────── */
export function getAiProvider(): AIProvider {
  switch ((process.env.AI_PROVIDER || "").toLowerCase()) {
    case "anthropic":
      return new AnthropicProvider();
    case "gemini":
      return new GeminiProvider();
    case "openai":
    default:
      return new OpenAICompatibleProvider();
  }
}

export async function askForJson<T>(
  provider: AIProvider,
  system: string,
  user: string,
  schema: z.ZodTypeAny,
  retries = 1,
): Promise<T> {
  const content = await provider.complete(
    `${system}\n\nRespond with ONLY a single valid JSON object. Do not wrap it in markdown fences or add commentary.`,
    user,
    { temperature: 0.2, maxTokens: 1200 },
  );
  try {
    const json = extractJson(content);
    return schema.parse(json) as T;
  } catch (err) {
    if (retries > 0) {
      return askForJson(
        provider,
        system,
        `${user}\n\n(Your previous response failed validation. Return strictly valid JSON matching the schema.)`,
        schema,
        retries - 1,
      );
    }
    if (err instanceof AiSchemaError) throw err;
    throw new AiSchemaError(`AI returned invalid data: ${err instanceof Error ? err.message : "unknown error"}`, content);
  }
}

function extractJson(content: string): unknown {
  const trimmed = content.trim();
  // strip markdown fences
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1]! : trimmed;
  try {
    return JSON.parse(candidate);
  } catch {
    // some models return a leading line of prose; try to find the first { ... }
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start !== -1 && end > start) {
      return JSON.parse(candidate.slice(start, end + 1));
    }
    throw new AiSchemaError("No JSON object found in model output", content);
  }
}
