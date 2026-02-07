#!/usr/bin/env bun

/**
 * Check API Keys Configuration
 * 
 * Verifies that all required API keys are properly configured
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

async function checkGroqKey(): Promise<boolean> {
  console.log(`\n🔍 Checking Groq API Key...`);

  try {
    const response = await fetch(`${BACKEND_URL}/workflow/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "test api key" }),
    });

    const data = await response.json();

    if (response.status === 500 && data.error) {
      console.error(`❌ Groq API Key Error: ${data.error}`);
      console.error(`\n💡 To fix:`);
      console.error(`   1. Get a Groq API key from: https://console.groq.com/keys`);
      console.error(`   2. Open backend/.env`);
      console.error(`   3. Replace: GROQ_API_KEY=your_groq_api_key_here`);
      console.error(`   4. With: GROQ_API_KEY=gsk_your_actual_key`);
      console.error(`   5. Restart backend: cd backend && bun run dev`);
      return false;
    }

    if (response.ok) {
      console.log(`✅ Groq API Key is configured and working`);
      return true;
    }

    console.error(`❌ Unexpected response: ${response.status}`);
    return false;
  } catch (error) {
    console.error(`❌ Failed to check Groq key:`, error);
    return false;
  }
}

async function checkTamboKey(): Promise<boolean> {
  console.log(`\n🔍 Checking Tambo API Key...`);

  const tamboKey = process.env.NEXT_PUBLIC_TAMBO_API_KEY;

  if (!tamboKey || tamboKey === "your_tambo_api_key_here") {
    console.error(`❌ Tambo API Key not configured`);
    console.error(`\n💡 To fix:`);
    console.error(`   1. Get a Tambo API key from: https://tambo.ai`);
    console.error(`   2. Open frontend/.env.local`);
    console.error(`   3. Replace: NEXT_PUBLIC_TAMBO_API_KEY=your_tambo_api_key_here`);
    console.error(`   4. With: NEXT_PUBLIC_TAMBO_API_KEY=tambo_your_actual_key`);
    console.error(`   5. Restart frontend: cd frontend && bun run dev`);
    return false;
  }

  console.log(`✅ Tambo API Key is configured`);
  console.log(`   Key: ${tamboKey.slice(0, 20)}...`);
  return true;
}

async function checkMongoDB(): Promise<boolean> {
  console.log(`\n🔍 Checking MongoDB Connection...`);

  try {
    const response = await fetch(`${BACKEND_URL}/db/schemas`, {
      method: "GET",
    });

    if (response.ok) {
      console.log(`✅ MongoDB is connected`);
      return true;
    }

    console.error(`❌ MongoDB connection failed: ${response.status}`);
    console.error(`\n💡 To fix:`);
    console.error(`   1. Make sure MongoDB is running`);
    console.error(`   2. Check MONGODB_URI in backend/.env`);
    console.error(`   3. Default: mongodb://localhost:27017/orchestrix`);
    return false;
  } catch (error) {
    console.error(`❌ Failed to check MongoDB:`, error);
    return false;
  }
}

async function main() {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`🔑 API KEYS CONFIGURATION CHECK`);
  console.log(`${"=".repeat(60)}`);

  const results = {
    groq: await checkGroqKey(),
    tambo: await checkTamboKey(),
    mongodb: await checkMongoDB(),
  };

  console.log(`\n${"=".repeat(60)}`);
  console.log(`📊 CONFIGURATION STATUS`);
  console.log(`${"=".repeat(60)}`);
  console.log(`Groq API:    ${results.groq ? "✅ CONFIGURED" : "❌ NOT CONFIGURED"}`);
  console.log(`Tambo API:   ${results.tambo ? "✅ CONFIGURED" : "❌ NOT CONFIGURED"}`);
  console.log(`MongoDB:     ${results.mongodb ? "✅ CONNECTED" : "❌ NOT CONNECTED"}`);
  console.log(`${"=".repeat(60)}`);

  const allConfigured = results.groq && results.tambo && results.mongodb;

  if (allConfigured) {
    console.log(`\n✅ All API keys are configured!`);
    console.log(`\n🚀 You can now run:`);
    console.log(`   bun run test:real    # Real integration test`);
    console.log(`   bun run dev          # Start frontend`);
    console.log(`${"=".repeat(60)}\n`);
    process.exit(0);
  } else {
    console.log(`\n❌ Some configurations are missing.`);
    console.log(`   Fix the issues above and run this script again.`);
    console.log(`${"=".repeat(60)}\n`);
    process.exit(1);
  }
}

main();
