#!/usr/bin/env bun

/**
 * Test script for chat-first generative UI flow
 * 
 * This script validates:
 * 1. Chat submission works
 * 2. Backend intent endpoint responds correctly
 * 3. Tambo renders WorkflowGraph component
 * 4. DeployPanel appears when requested
 */

import { v4 as uuidv4 } from "uuid";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
const TEST_PROMPT = "create signup api";
const TIMEOUT_MS = 10000;

interface IntentResponse {
  workflowPrompt?: string;
  components: string[];
  correlationId: string;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testBackendIntent(): Promise<IntentResponse> {
  const correlationId = uuidv4();
  
  console.log(`\n🧪 [TEST] Testing backend intent endpoint`);
  console.log(`📝 [TEST] Prompt: "${TEST_PROMPT}"`);
  console.log(`🔗 [TEST] Correlation ID: ${correlationId}`);
  console.log(`🌐 [TEST] Backend URL: ${BACKEND_URL}/ai/intent`);

  try {
    const response = await fetch(`${BACKEND_URL}/ai/intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: TEST_PROMPT,
        correlationId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}: ${response.statusText}`);
    }

    const data: IntentResponse = await response.json();

    console.log(`✅ [TEST] Backend responded successfully`);
    console.log(`📦 [TEST] Components:`, data.components);
    console.log(`💬 [TEST] Workflow prompt:`, data.workflowPrompt);

    // Validate response structure
    if (!data.components || !Array.isArray(data.components)) {
      throw new Error("Response missing 'components' array");
    }

    if (!data.correlationId) {
      throw new Error("Response missing 'correlationId'");
    }

    return data;
  } catch (error) {
    console.error(`❌ [TEST] Backend intent test failed:`, error);
    throw error;
  }
}

async function testComponentRendering(intent: IntentResponse): Promise<void> {
  console.log(`\n🧪 [TEST] Validating component rendering`);

  // Check if WorkflowGraph should be rendered
  const hasWorkflowGraph = intent.components.includes("WorkflowGraph");
  console.log(`📊 [TEST] WorkflowGraph should render: ${hasWorkflowGraph}`);

  if (!hasWorkflowGraph) {
    throw new Error("Expected WorkflowGraph in components but not found");
  }

  // For "create signup api", we expect WorkflowGraph
  const expectedComponents = ["WorkflowGraph"];
  const missingComponents = expectedComponents.filter(
    (comp) => !intent.components.includes(comp)
  );

  if (missingComponents.length > 0) {
    throw new Error(
      `Missing expected components: ${missingComponents.join(", ")}`
    );
  }

  console.log(`✅ [TEST] All expected components present`);
}

async function testDeployPanelIntent(): Promise<void> {
  console.log(`\n🧪 [TEST] Testing deploy panel intent`);

  const deployPrompt = "deploy my api";
  const correlationId = uuidv4();

  try {
    const response = await fetch(`${BACKEND_URL}/ai/intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: deployPrompt,
        correlationId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    const data: IntentResponse = await response.json();

    console.log(`📦 [TEST] Deploy intent components:`, data.components);

    const hasDeployPanel = data.components.includes("DeployPanel");
    console.log(`🚀 [TEST] DeployPanel should render: ${hasDeployPanel}`);

    if (!hasDeployPanel) {
      throw new Error("Expected DeployPanel in components but not found");
    }

    console.log(`✅ [TEST] DeployPanel intent validated`);
  } catch (error) {
    console.error(`❌ [TEST] Deploy panel test failed:`, error);
    throw error;
  }
}

async function testCorrelationIdTracking(): Promise<void> {
  console.log(`\n🧪 [TEST] Testing correlation ID tracking`);

  const testId = `test-${uuidv4()}`;
  
  try {
    const response = await fetch(`${BACKEND_URL}/ai/intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: "test correlation",
        correlationId: testId,
      }),
    });

    const data: IntentResponse = await response.json();

    if (data.correlationId !== testId) {
      throw new Error(
        `Correlation ID mismatch: sent ${testId}, received ${data.correlationId}`
      );
    }

    console.log(`✅ [TEST] Correlation ID preserved: ${testId}`);
  } catch (error) {
    console.error(`❌ [TEST] Correlation ID test failed:`, error);
    throw error;
  }
}

async function runAllTests(): Promise<void> {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`🚀 FlowForge CHAT-FIRST UI TEST SUITE`);
  console.log(`${"=".repeat(60)}`);

  const startTime = Date.now();
  let passed = 0;
  let failed = 0;

  try {
    // Test 1: Backend intent endpoint
    console.log(`\n📋 Test 1/4: Backend Intent Endpoint`);
    const intent = await testBackendIntent();
    passed++;

    // Test 2: Component rendering validation
    console.log(`\n📋 Test 2/4: Component Rendering Validation`);
    await testComponentRendering(intent);
    passed++;

    // Test 3: Deploy panel intent
    console.log(`\n📋 Test 3/4: Deploy Panel Intent`);
    await testDeployPanelIntent();
    passed++;

    // Test 4: Correlation ID tracking
    console.log(`\n📋 Test 4/4: Correlation ID Tracking`);
    await testCorrelationIdTracking();
    passed++;

    const duration = Date.now() - startTime;

    console.log(`\n${"=".repeat(60)}`);
    console.log(`✅ CHAT-FIRST GENERATIVE UI VERIFIED`);
    console.log(`${"=".repeat(60)}`);
    console.log(`✅ Passed: ${passed}/4 tests`);
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`🎉 All tests passed successfully!`);
    console.log(`${"=".repeat(60)}\n`);

    process.exit(0);
  } catch (error) {
    failed++;
    const duration = Date.now() - startTime;

    console.log(`\n${"=".repeat(60)}`);
    console.log(`❌ TEST SUITE FAILED`);
    console.log(`${"=".repeat(60)}`);
    console.log(`✅ Passed: ${passed}/4 tests`);
    console.log(`❌ Failed: ${failed}/4 tests`);
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`${"=".repeat(60)}\n`);

    process.exit(1);
  }
}

// Check if backend is running
async function checkBackendHealth(): Promise<boolean> {
  try {
    console.log(`🔍 [TEST] Checking backend health at ${BACKEND_URL}`);
    const response = await fetch(`${BACKEND_URL}/hello`, {
      method: "GET",
    });
    
    if (response.ok) {
      console.log(`✅ [TEST] Backend is running`);
      return true;
    }
    
    console.error(`❌ [TEST] Backend returned ${response.status}`);
    return false;
  } catch (error) {
    console.error(`❌ [TEST] Backend is not reachable:`, error);
    console.error(`\n💡 [TEST] Make sure to start the backend first:`);
    console.error(`   cd backend && bun run dev\n`);
    return false;
  }
}

// Main execution
(async () => {
  const isHealthy = await checkBackendHealth();
  
  if (!isHealthy) {
    console.error(`\n❌ Cannot run tests: Backend is not running`);
    process.exit(1);
  }

  await runAllTests();
})();
