#!/usr/bin/env bun

/**
 * Backend Explain Workflow Test
 * 
 * Tests the explain workflow feature:
 * 1. Create workflow with multiple steps
 * 2. Call explain endpoint
 * 3. Verify explanation structure
 */

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";
const OWNER_ID = "test_user_explain";

interface ExplanationResponse {
  workflowId: string;
  summary: string;
  steps: Array<{
    order: number;
    type: string;
    label: string;
    description: string;
    icon: string;
  }>;
  dataFlow: string[];
  securityNotes: Array<{
    type: string;
    message: string;
    severity: string;
  }>;
  nodeCount: number;
  correlationId: string;
}

async function createWorkflow(prompt: string): Promise<string> {
  console.log(`\n🤖 Creating workflow: "${prompt}"`);

  const intentResponse = await fetch(`${BACKEND_URL}/ai/intent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      ownerId: OWNER_ID,
      correlationId: `test-${Date.now()}`,
    }),
  });

  if (!intentResponse.ok) {
    throw new Error(`Intent endpoint returned ${intentResponse.status}`);
  }

  const intentData = await intentResponse.json();
  const workflowId = intentData.workflowId;

  console.log(`   WorkflowId: ${workflowId}`);

  // Generate workflow
  const genResponse = await fetch(`${BACKEND_URL}/workflow/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      workflowId,
      ownerId: OWNER_ID,
    }),
  });

  if (!genResponse.ok) {
    throw new Error(`Workflow generation returned ${genResponse.status}`);
  }

  const workflow = await genResponse.json();
  console.log(`   ✅ Created with ${workflow.nodes?.length || 0} nodes`);

  // Wait for save
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return workflowId;
}

async function explainWorkflow(workflowId: string): Promise<ExplanationResponse> {
  console.log(`\n📖 Explaining workflow: ${workflowId}`);

  const response = await fetch(`${BACKEND_URL}/workflow/explain`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      workflowId,
      ownerId: OWNER_ID,
      correlationId: `explain-${Date.now()}`,
    }),
  });

  if (!response.ok) {
    throw new Error(`Explain endpoint returned ${response.status}`);
  }

  const explanation: ExplanationResponse = await response.json();

  console.log(`   ✅ Explanation received:`);
  console.log(`      Steps: ${explanation.steps.length}`);
  console.log(`      Data Flow: ${explanation.dataFlow.length}`);
  console.log(`      Security Notes: ${explanation.securityNotes.length}`);

  return explanation;
}

async function testExplainWorkflow(): Promise<void> {
  console.log(`\n${"=".repeat(70)}`);
  console.log(`🧪 EXPLAIN WORKFLOW TEST`);
  console.log(`${"=".repeat(70)}`);

  try {
    // Step 1: Create a complex workflow
    console.log(`\n${"─".repeat(70)}`);
    console.log(`📋 Step 1: Create Complex Workflow`);
    console.log(`${"─".repeat(70)}`);

    const workflowId = await createWorkflow(
      "create signup api with jwt authentication and email verification"
    );

    // Step 2: Explain the workflow
    console.log(`\n${"─".repeat(70)}`);
    console.log(`📋 Step 2: Explain Workflow`);
    console.log(`${"─".repeat(70)}`);

    const explanation = await explainWorkflow(workflowId);

    // Step 3: Validate explanation structure
    console.log(`\n${"─".repeat(70)}`);
    console.log(`📋 Step 3: Validate Explanation`);
    console.log(`${"─".repeat(70)}`);

    // Validate steps
    if (explanation.steps.length === 0) {
      throw new Error("Explanation has no steps");
    }
    console.log(`   ✅ Steps array populated (${explanation.steps.length} steps)`);

    // Validate each step has required fields
    for (const step of explanation.steps) {
      if (!step.order || !step.type || !step.label || !step.description || !step.icon) {
        throw new Error(`Step ${step.order} is missing required fields`);
      }
    }
    console.log(`   ✅ All steps have required fields`);

    // Validate security notes
    if (explanation.securityNotes.length === 0) {
      throw new Error("Explanation has no security notes");
    }
    console.log(`   ✅ Security notes populated (${explanation.securityNotes.length} notes)`);

    // Validate data flow
    if (explanation.dataFlow.length === 0) {
      throw new Error("Explanation has no data flow");
    }
    console.log(`   ✅ Data flow populated (${explanation.dataFlow.length} items)`);

    // Validate summary
    if (!explanation.summary || explanation.summary.length < 10) {
      throw new Error("Summary is missing or too short");
    }
    console.log(`   ✅ Summary generated`);

    // Display explanation
    console.log(`\n${"─".repeat(70)}`);
    console.log(`📋 Explanation Output`);
    console.log(`${"─".repeat(70)}`);
    console.log(`\nSummary: ${explanation.summary}\n`);
    console.log(`Steps:`);
    explanation.steps.forEach((step) => {
      console.log(`   ${step.order}. ${step.label} - ${step.description}`);
    });
    console.log(`\nSecurity Notes:`);
    explanation.securityNotes.forEach((note) => {
      console.log(`   [${note.severity.toUpperCase()}] ${note.message}`);
    });

    // Final verification
    console.log(`\n${"=".repeat(70)}`);
    console.log(`✅ EXPLAIN WORKFLOW TEST PASSED`);
    console.log(`${"=".repeat(70)}`);
    console.log(`WorkflowId: ${workflowId}`);
    console.log(`Steps explained: ${explanation.steps.length}`);
    console.log(`Security notes: ${explanation.securityNotes.length}`);
    console.log(`Data flow items: ${explanation.dataFlow.length}`);
    console.log(`\n🎉 Backend explanation feature verified!`);
    console.log(`${"=".repeat(70)}\n`);

    process.exit(0);
  } catch (error) {
    console.error(`\n❌ Test failed:`, error);
    console.log(`\n${"=".repeat(70)}`);
    console.log(`❌ EXPLAIN WORKFLOW TEST FAILED`);
    console.log(`${"=".repeat(70)}\n`);
    process.exit(1);
  }
}

// Check backend health
async function checkBackend(): Promise<boolean> {
  try {
    console.log(`🔍 Checking backend at ${BACKEND_URL}...`);
    const response = await fetch(`${BACKEND_URL}/hello`);
    if (response.ok) {
      console.log(`✅ Backend is running\n`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Backend is not reachable`);
    console.error(`   Start it with: bun run dev\n`);
    return false;
  }
}

(async () => {
  if (!(await checkBackend())) {
    process.exit(1);
  }
  await testExplainWorkflow();
})();
