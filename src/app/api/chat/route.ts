/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { openai } from '@ai-sdk/openai';
import { convertToCoreMessages, streamText } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: openai("gpt-4o"),
    system: 'You are a helpful assistant.',
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    messages: convertToCoreMessages(messages),
  });

  return result.toAIStreamResponse();
}