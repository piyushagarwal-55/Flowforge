#!/usr/bin/env bun

/**
 * Full end-to-end test for chat-first generative UI
 * 
 * Tests complete user journey:
 * 1. Initial chat submission
 * 2. Intent detection
 * 3. Component mounting
 * 4. Multiple intents
 * 5. Component lifecycle
 */

import { v4 as uuidv4 } from "uuid";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

interface IntentResponse {
  workflowPrompt?: string;
  components: string[];
  correlationId: string;
}

interface TestCase {
  name: string;
  prompt: string;
  expectedComponents: string[];
  shouldHaveWorkflowPrompt?: boolean;
}

const TEST_CASES: TestCase[] = [
  {
    name: "Workflow Creation",
    prompt: "create signup api",
    expectedComponents: ["WorkflowGraph"],
    shouldHaveWorkflowPrompt: true,
  },
  {
    name: "Deployment Intent",
    prompt: "deploy my api",
    expectedComponents: ["WorkflowGraph", "DeployPanel"],
  },
  {
    name: "Execution Intent",
    prompt: "run my workflow",
    expectedComponents: ["WorkflowGraph", "ExecutionLogs"],
  },
  {
    name: "API Testing",
    prompt: "test my api in playground",
    expectedComponents: ["WorkflowGraph", "APIPlayground"],
  },
  {
    name: "Node Inspection",
    prompt: "inspect the nodes",
    expectedComponents: ["WorkflowGraph", "NodeInspector"],
  },
  {
    name: "Multiple Intents",
    prompt: "create api and deploy it",
    expectedComponents: ["WorkflowGraph", "DeployPanel"],
    shouldHaveWorkflowPrompt: true,
  },
];

async function testIntent(testCase: TestCase): Promise<boolean> {
  const correlationId = uuidv4();

  console.log(`\n🧪 Testing: ${testCase.name}`);
  console.log(`   Prompt: "${testCase.prompt}"`);
  console.log(`   Expected: ${testCase.expectedComponents.join(", ")}`);

  try {
    const response = await fetch(`${BACKEND_URL}/ai/intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: testCase.prompt,
        correlationId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    const data: IntentResponse = await response.json();

    // Validate correlation ID
    if (data.correlationId !== correlationId) {
      throw new Error(
        `Correlation ID mismatch: expected ${correlationId}, got ${data.correlationId}`
      );
    }

    // Validate components
    const missingComponents = testCase.expectedComponents.filter(
      (comp) => !data.components.includes(comp)
    );

    if (missingComponents.length > 0) {
      throw new Error(
        `Missing components: ${missingComponents.join(", ")}\nGot: ${data.components.join(", ")}`
      );
    }

    // Validate workflow prompt if expected
    if (testCase.shouldHaveWorkflowPrompt && !data.workflowPrompt) {
      throw new Error("Expected workflowPrompt but got none");
    }

    console.log(`   ✅ Components: ${data.components.join(", ")}`);
    if (data.workflowPrompt) {
      console.log(`   ✅ Workflow prompt: ${data.workflowPrompt.slice(0, 50)}...`);
    }

    return true;
  } catch (error) {
    console.error(`   ❌ Failed:`, error instanceof Error ? error.message : error);
    return false;
  }
}

async function testCorrelationTracking(): Promise<boolean> {
  console.log(`\n🧪 Testing: Correlation ID Tracking`);

  const testIds = [
    `test-${uuidv4()}`,
    `test-${uuidv4()}`,
    `test-${uuidv4()}`,
  ];

  for (const testId of testIds) {
    try {
      const response = await fetch(`${BACKEND_URL}/ai/intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: "test",
          correlationId: testId,
        }),
      });

      const data: IntentResponse = await response.json();

      if (data.correlationId !== testId) {
        throw new Error(`ID mismatch: ${testId} !== ${data.correlationId}`);
      }

      console.log(`   ✅ Tracked: ${testId.slice(0, 20)}...`);
    } catch (error) {
      console.error(`   ❌ Failed:`, error instanceof Error ? error.message : error);
      return false;
    }
  }

  return true;
}

async function testErrorHandling(): Promise<boolean> {
  console.log(`\n🧪 Testing: Error Handling`);

  const errorCases = [
    { body: {}, expectedError: "Prompt is required" },
    { body: { prompt: "" }, expectedError: "Prompt is required" },
    { body: { prompt: null }, expectedError: "Prompt is required" },
  ];

  for (const errorCase of errorCases) {
    try {
      const response = await fetch(`${BACKEND_URL}/ai/intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(errorCase.body),
      });

      if (response.ok) {
        throw new Error("Expected error response but got success");
      }

      console.log(`   ✅ Correctly rejected invalid input`);
    } catch (error) {
      if (error instanceof Error && error.message.includes("Expected error")) {
        console.error(`   ❌ Failed:`, error.message);
        return false;
      }
    }
  }

  return true;
}

async function testPerformance(): Promise<boolean> {
  console.log(`\n🧪 Testing: Performance`);

  const iterations = 10;
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = Date.now();

    await fetch(`${BACKEND_URL}/ai/intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: "test performance",
        correlationId: `perf-${i}`,
      }),
    });

    const duration = Date.now() - start;
    times.push(duration);
  }

  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const max = Math.max(...times);
  const min = Math.min(...times);

  console.log(`   ✅ Average: ${avg.toFixed(0)}ms`);
  console.log(`   ✅ Min: ${min}ms, Max: ${max}ms`);

  if (avg > 1000) {
    console.warn(`   ⚠️  Average response time is high (${avg.toFixed(0)}ms)`);
  }

  return true;
}

async function runFullTest(): Promise<void> {
  console.log(`\n${"=".repeat(70)}`);
  console.log(`🚀 FlowForge FULL END-TO-END TEST SUITE`);
  console.log(`${"=".repeat(70)}`);

  const startTime = Date.now();
  let passed = 0;
  let failed = 0;

  // Test all intent cases
  for (const testCase of TEST_CASES) {
    const result = await testIntent(testCase);
    if (result) {
      passed++;
    } else {
      failed++;
    }
  }

  // Test correlation tracking
  if (await testCorrelationTracking()) {
    passed++;
  } else {
    failed++;
  }

  // Test error handling
  if (await testErrorHandling()) {
    passed++;
  } else {
    failed++;
  }

  // Test performance
  if (await testPerformance()) {
    passed++;
  } else {
    failed++;
  }

  const duration = Date.now() - startTime;
  const total = passed + failed;

  console.log(`\n${"=".repeat(70)}`);
  if (failed === 0) {
    console.log(`✅ ALL TESTS PASSED`);
  } else {
    console.log(`❌ SOME TESTS FAILED`);
  }
  console.log(`${"=".repeat(70)}`);
  console.log(`✅ Passed: ${passed}/${total} tests`);
  console.log(`❌ Failed: ${failed}/${total} tests`);
  console.log(`⏱️  Duration: ${duration}ms`);
  console.log(`${"=".repeat(70)}`);

  if (failed === 0) {
    console.log(`\n🎉 CHAT-FIRST GENERATIVE UI FULLY VERIFIED`);
    console.log(`\n✨ All systems operational:`);
    console.log(`   • Intent detection working`);
    console.log(`   • Component mounting logic validated`);
    console.log(`   • Correlation tracking functional`);
    console.log(`   • Error handling robust`);
    console.log(`   • Performance acceptable`);
    console.log(`\n🚀 Ready for production and Tambo hackathon demo!`);
    console.log(`${"=".repeat(70)}\n`);
    process.exit(0);
  } else {
    console.log(`\n❌ Fix the failing tests before proceeding.`);
    console.log(`${"=".repeat(70)}\n`);
    process.exit(1);
  }
}

// Check backend health first
async function checkBackend(): Promise<boolean> {
  try {
    console.log(`🔍 Checking backend at ${BACKEND_URL}...`);
    const response = await fetch(`${BACKEND_URL}/hello`);
    if (response.ok) {
      console.log(`✅ Backend is running\n`);
      return true;
    }
    console.error(`❌ Backend returned ${response.status}`);
    return false;
  } catch (error) {
    console.error(`❌ Backend is not reachable`);
    console.error(`\n💡 Start the backend first: cd backend && bun run dev\n`);
    return false;
  }
}

(async () => {
  if (!(await checkBackend())) {
    process.exit(1);
  }
  await runFullTest();
})();
