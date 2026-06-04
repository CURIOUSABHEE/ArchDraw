import type Groq from 'groq-sdk';
import type { ChatCompletionCreateParamsNonStreaming } from 'groq-sdk/resources/chat/completions';

function isResponseFormatError(error: unknown): boolean {
  const err = error as { message?: string; status?: number };
  const msg = (err.message || '').toLowerCase();
  return (
    msg.includes('response_format') ||
    msg.includes('json_object') ||
    msg.includes('json mode') ||
    msg.includes('unsupported')
  );
}

type CompletionParams = Omit<ChatCompletionCreateParamsNonStreaming, 'response_format'>;

/**
 * Groq chat completion preferring JSON mode; retries without response_format if unsupported.
 */
export async function groqJsonCompletion(
  client: Groq,
  params: CompletionParams
): Promise<string> {
  try {
    const completion = await client.chat.completions.create({
      ...params,
      response_format: { type: 'json_object' },
    });
    return completion.choices[0]?.message?.content ?? '';
  } catch (error) {
    if (!isResponseFormatError(error)) throw error;
    const completion = await client.chat.completions.create(params);
    return completion.choices[0]?.message?.content ?? '';
  }
}
