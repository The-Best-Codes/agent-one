import { convertToModelMessages, streamText, type LanguageModel } from "ai";

export const customFetch = async (
  _input: RequestInfo | URL,
  modelFn: LanguageModel,
  init?: RequestInit,
) => {
  const m = JSON.parse(init?.body as string);
  const result = streamText({
    model: modelFn,
    messages: convertToModelMessages(m.messages),
    abortSignal: init?.signal as AbortSignal | undefined,
  });
  return result.toUIMessageStreamResponse();
};
