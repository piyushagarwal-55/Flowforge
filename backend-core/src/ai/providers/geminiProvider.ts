import { GoogleGenerativeAI } from "@google/generative-ai";

export function createGeminiProvider(model = "gemini-flash-latest") {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  async function generateWorkflow(
    prompt: string,
    system: string
  ): Promise<string> {
    const geminiModel = genAI.getGenerativeModel({
      model: "gemini-flash-latest", // Using original model name
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 8000, // Gemini supports much larger outputs
      },
    });

    // Gemini doesn't have separate system messages, so combine them
    const fullPrompt = `${system}\n\n${prompt}`;

    const result = await geminiModel.generateContent(fullPrompt);
    const response = result.response;
    let text = response.text();

    // cleanup any accidental markdown
    return text.replace(/```json|```/g, "").trim();
  }

  return { generateWorkflow };
}
