/**
 * Test script to test Gemini model names
 * Run with: bun run test-gemini-models.ts
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

async function testGeminiModels() {
  console.log('🔍 Testing Gemini model names...\n');

  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY not found in .env file');
    return;
  }

  console.log('API Key:', apiKey.substring(0, 10) + '...\n');

  const genAI = new GoogleGenerativeAI(apiKey);

  // Test different model names
  const modelNames = [
    'gemini-flash-latest',
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-pro',
    'gemini-1.5-pro',
    'models/gemini-flash-latest',
    'models/gemini-1.5-flash',
    'models/gemini-1.5-flash-latest',
  ];

  for (const modelName of modelNames) {
    try {
      console.log(`Testing: ${modelName}`);
      
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Say "test successful"');
      const response = result.response.text();
      
      console.log(`✅ ${modelName} - WORKS!`);
      console.log(`   Response: ${response.substring(0, 50)}...\n`);
      
    } catch (error) {
      console.log(`❌ ${modelName} - Failed`);
      if (error instanceof Error) {
        console.log(`   Error: ${error.message.substring(0, 100)}...\n`);
      }
    }
  }
}

testGeminiModels().catch(console.error);

