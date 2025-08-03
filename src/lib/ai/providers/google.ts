import { createGoogleGenerativeAI } from "@ai-sdk/google";

export const google = createGoogleGenerativeAI({
  apiKey: import.meta.env.VITE_GOOGLE_GENERATIVE_AI_API_KEY,
});
