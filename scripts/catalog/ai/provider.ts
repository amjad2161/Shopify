import type {CatalogEnv} from '../types.ts';

export function isAiEnabled(env: CatalogEnv) {
  const flag = env.CATALOG_AI_ENABLED?.trim().toLowerCase();
  return flag === '1' || flag === 'true' || flag === 'yes';
}

export function hasAiCredentials(env: CatalogEnv) {
  return Boolean(
    env.CATALOG_AI_API_KEY?.trim() ||
      env.OPENAI_API_KEY?.trim?.() ||
      process.env.OPENAI_API_KEY?.trim(),
  );
}

type ChatMessage = {role: 'system' | 'user'; content: string};

/**
 * Optional OpenAI-compatible chat completion for trend keyword expansion.
 * Falls back gracefully when no API key is configured.
 */
export async function aiComplete(
  env: CatalogEnv,
  messages: ChatMessage[],
): Promise<string | null> {
  if (!isAiEnabled(env) || !hasAiCredentials(env)) return null;

  const apiKey =
    env.CATALOG_AI_API_KEY?.trim() ||
    env.OPENAI_API_KEY?.trim() ||
    process.env.OPENAI_API_KEY?.trim();
  const baseUrl = (
    env.CATALOG_AI_API_URL?.trim() || 'https://api.openai.com/v1'
  ).replace(/\/$/, '');
  const model = env.CATALOG_AI_API_KEY?.trim()
    ? env.CATALOG_AI_MODEL?.trim() || 'gpt-4o-mini'
    : env.CATALOG_AI_MODEL?.trim() || 'gpt-4o-mini';

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        max_tokens: 800,
        messages,
      }),
    });

    if (!response.ok) return null;

    const data = (await response.json()) as {
      choices?: Array<{message?: {content?: string}}>;
    };
    return data.choices?.[0]?.message?.content?.trim() ?? null;
  } catch {
    return null;
  }
}
