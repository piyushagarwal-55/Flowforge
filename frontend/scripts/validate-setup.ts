#!/usr/bin/env bun

/**
 * Validation script for FlowForge chat-first UI setup
 * 
 * Checks:
 * - Environment variables
 * - File structure
 * - Dependencies
 * - Backend connectivity
 */

import { existsSync } from "fs";
import { join } from "path";

const REQUIRED_FILES = [
  ".env.local",
  "components/ChatShell.tsx",
  "app/page.tsx",
  "components/AppProviders.tsx",
];

const REQUIRED_ENV_VARS = [
  "NEXT_PUBLIC_TAMBO_API_KEY",
  "NEXT_PUBLIC_BACKEND_URL",
];

function checkFiles(): boolean {
  console.log(`\n📁 Checking required files...`);
  let allExist = true;

  for (const file of REQUIRED_FILES) {
    const filePath = join(process.cwd(), file);
    const exists = existsSync(filePath);
    
    if (exists) {
      console.log(`  ✅ ${file}`);
    } else {
      console.log(`  ❌ ${file} - NOT FOUND`);
      allExist = false;
    }
  }

  return allExist;
}

function checkEnvVars(): boolean {
  console.log(`\n🔐 Checking environment variables...`);
  let allSet = true;

  for (const envVar of REQUIRED_ENV_VARS) {
    const value = process.env[envVar];
    
    if (value) {
      console.log(`  ✅ ${envVar} = ${value.slice(0, 20)}...`);
    } else {
      console.log(`  ❌ ${envVar} - NOT SET`);
      allSet = false;
    }
  }

  return allSet;
}

async function checkBackend(): Promise<boolean> {
  console.log(`\n🌐 Checking backend connectivity...`);
  
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
  
  try {
    const response = await fetch(`${backendUrl}/hello`, {
      method: "GET",
    });
    
    if (response.ok) {
      console.log(`  ✅ Backend is running at ${backendUrl}`);
      return true;
    } else {
      console.log(`  ⚠️  Backend returned ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`  ❌ Backend is not reachable at ${backendUrl}`);
    console.log(`     Start it with: cd backend && bun run dev`);
    return false;
  }
}

async function checkIntentEndpoint(): Promise<boolean> {
  console.log(`\n🎯 Checking /ai/intent endpoint...`);
  
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
  
  try {
    const response = await fetch(`${backendUrl}/ai/intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: "test",
        correlationId: "validation-test",
      }),
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`  ✅ Intent endpoint is working`);
      console.log(`     Components: ${data.components?.join(", ") || "none"}`);
      return true;
    } else {
      console.log(`  ❌ Intent endpoint returned ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`  ❌ Intent endpoint is not reachable`);
    console.log(`     Make sure backend/src/steps/ai-intent.step.ts exists`);
    return false;
  }
}

async function main() {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`🔍 FlowForge SETUP VALIDATION`);
  console.log(`${"=".repeat(60)}`);

  const results = {
    files: checkFiles(),
    envVars: checkEnvVars(),
    backend: await checkBackend(),
    intentEndpoint: await checkIntentEndpoint(),
  };

  console.log(`\n${"=".repeat(60)}`);
  console.log(`📊 VALIDATION RESULTS`);
  console.log(`${"=".repeat(60)}`);
  console.log(`Files:           ${results.files ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`Environment:     ${results.envVars ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`Backend:         ${results.backend ? "✅ PASS" : "⚠️  WARNING"}`);
  console.log(`Intent Endpoint: ${results.intentEndpoint ? "✅ PASS" : "⚠️  WARNING"}`);

  const allPassed = results.files && results.envVars;
  const backendReady = results.backend && results.intentEndpoint;

  if (allPassed && backendReady) {
    console.log(`\n✅ All checks passed! Ready to run.`);
    console.log(`\n🚀 Start the frontend with: bun run dev`);
    console.log(`🧪 Run tests with: bun run test:chat`);
    console.log(`${"=".repeat(60)}\n`);
    process.exit(0);
  } else if (allPassed) {
    console.log(`\n⚠️  Setup is valid but backend is not running.`);
    console.log(`\n💡 Start the backend first:`);
    console.log(`   cd backend && bun run dev`);
    console.log(`${"=".repeat(60)}\n`);
    process.exit(0);
  } else {
    console.log(`\n❌ Setup validation failed. Fix the issues above.`);
    console.log(`${"=".repeat(60)}\n`);
    process.exit(1);
  }
}

main();
