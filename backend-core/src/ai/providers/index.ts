import { createOpenAIProvider } from "./openaiProvider";
import { createGroqProvider } from "./groqProvider";
import { createGeminiProvider } from "./geminiProvider";

/**
 * Get AI provider by name
 * Migrated from backend/src/ai/providers/index.ts
 */
export function getAIProvider(name: string) {
  switch (name) {
    case "openai":
      return createOpenAIProvider();
    case "groq":
      return createGroqProvider();
    case "gemini":
      return createGeminiProvider();
    default:
      throw new Error("Unknown AI provider: " + name);
  }
}
