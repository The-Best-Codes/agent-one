import { createGroq } from "@ai-sdk/groq";

export const groq = createGroq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
});
