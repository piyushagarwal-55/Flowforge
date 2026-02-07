#!/usr/bin/env bun

/**
 * Frontend Explain UI Test
 * 
 * Tests the BackendExplainer component rendering:
 * 1. Create workflow
 * 2. Trigger explain intent
 * 3. Verify BackendExplainer mounts
 * 4. Validate UI elements
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";
const FRONTEND_URL = "http://localhost:5000";

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
    console.error(`   Start it with: cd backend && bun run dev\n`);
    return false;
  }
}

async function checkFrontend(): Promise<boolean> {
  try {
    console.log(`🔍 Checking frontend at ${FRONTEND_URL}...`);
    const response = await fetch(FRONTEND_URL);
    if (response.ok) {
      console.log(`✅ Frontend is running\n`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Frontend is not reachable`);
    console.error(`   Start it with: cd frontend && bun run dev\n`);
    return false;
  }
}

async function testExplainUI(): Promise<void> {
  console.log(`\n${"=".repeat(70)}`);
  console.log(`🧪 EXPLAIN UI TEST`);
  console.log(`${"=".repeat(70)}`);

  console.log(`\n${"─".repeat(70)}`);
  console.log(`📋 Test Scenario`);
  console.log(`${"─".repeat(70)}`);
  console.log(`1. Create workflow: "create signup api with jwt"`);
  console.log(`2. Trigger explain: "explain"`);
  console.log(`3. Verify BackendExplainer component renders`);
  console.log(`4. Validate UI elements present`);

  console.log(`\n${"─".repeat(70)}`);
  console.log(`📋 Manual Testing Steps`);
  console.log(`${"─".repeat(70)}`);
  console.log(`\n1. Open browser to ${FRONTEND_URL}`);
  console.log(`2. Type: "create signup api with jwt authentication"`);
  console.log(`3. Wait for workflow to generate`);
  console.log(`4. Type: "explain"`);
  console.log(`\n5. Verify the following:`);
  console.log(`   ✓ BackendExplainer component appears`);
  console.log(`   ✓ Summary card visible with workflow description`);
  console.log(`   ✓ At least 3 step cards visible`);
  console.log(`   ✓ Each step has: number, icon, title, description`);
  console.log(`   ✓ Security panel visible at bottom`);
  console.log(`   ✓ Security notes color-coded (green/yellow/blue)`);
  console.log(`   ✓ Data flow section visible`);
  console.log(`\n6. Verify UI consistency:`);
  console.log(`   ✓ Background matches FlowForge dark gradient`);
  console.log(`   ✓ Cards use glass morphism effect`);
  console.log(`   ✓ Typography matches ExecutionLogsSidebar`);
  console.log(`   ✓ Spacing consistent with other panels`);
  console.log(`   ✓ Colors match ui-map.ts tokens`);
  console.log(`   ✓ No visual discontinuity`);
  console.log(`   ✓ No mismatched padding`);
  console.log(`   ✓ No alien typography`);
  console.log(`   ✓ No color clashes`);

  console.log(`\n${"─".repeat(70)}`);
  console.log(`📋 Component Checklist`);
  console.log(`${"─".repeat(70)}`);
  console.log(`\nBackendExplainer should have:`);
  console.log(`   ✓ Header with BookOpen icon`);
  console.log(`   ✓ Workflow ID and node count`);
  console.log(`   ✓ Summary card with Zap icon`);
  console.log(`   ✓ "What This Backend Does" heading`);
  console.log(`   ✓ Data flow section with arrows`);
  console.log(`   ✓ "Step-by-Step Execution" heading`);
  console.log(`   ✓ Numbered step cards (1, 2, 3...)`);
  console.log(`   ✓ Step icons (user, lock, database, mail, etc.)`);
  console.log(`   ✓ Step descriptions in plain English`);
  console.log(`   ✓ Security panel with Shield icon`);
  console.log(`   ✓ Color-coded security badges`);

  console.log(`\n${"─".repeat(70)}`);
  console.log(`📋 Console Logs to Check`);
  console.log(`${"─".repeat(70)}`);
  console.log(`\nOpen browser DevTools Console and verify:`);
  console.log(`   ✓ [BackendExplainer] 🔍 Explain triggered`);
  console.log(`   ✓ [BackendExplainer] ✅ Explain rendered`);
  console.log(`   ✓ workflowId logged`);
  console.log(`   ✓ stepCount logged`);
  console.log(`   ✓ securityNoteCount logged`);

  console.log(`\n${"=".repeat(70)}`);
  console.log(`📸 VISUAL VERIFICATION REQUIRED`);
  console.log(`${"=".repeat(70)}`);
  console.log(`\nThis test requires manual visual verification.`);
  console.log(`Please complete the steps above and confirm:`);
  console.log(`\n✅ BackendExplainer renders correctly`);
  console.log(`✅ UI matches FlowForge design language`);
  console.log(`✅ All elements visible and functional`);
  console.log(`✅ No visual inconsistencies`);
  console.log(`\nIf all checks pass, log: EXPLAIN UI VERIFIED`);
  console.log(`${"=".repeat(70)}\n`);
}

(async () => {
  const backendOk = await checkBackend();
  const frontendOk = await checkFrontend();

  if (!backendOk || !frontendOk) {
    console.log(`\n❌ Prerequisites not met. Start both servers first.\n`);
    process.exit(1);
  }

  await testExplainUI();
  process.exit(0);
})();
