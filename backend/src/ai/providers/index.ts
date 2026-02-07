import { createOllamaProvider } from "./OllamaProvider";
import { createOpenAIProvider } from "./OpenAIProvider";
import { createHuggingFaceProvider } from "./HuggingFaceProvider";
import { createGroqProvider } from "./groqProvider";
import { createGeminiProvider } from "./geminiProvider";

export function getAIProvider(name: string) {
  switch (name) {
    case "ollama":
      return createOllamaProvider();
    case "openai":
      return createOpenAIProvider();
    case "huggingface":
      return createHuggingFaceProvider();
    case "groq":
      return createGroqProvider();
    case "gemini":
      return createGeminiProvider();
    default:
      throw new Error("Unknown AI provider: " + name);
  }
}
