/**
 * Test script for multiple workflow mutations
 * Tests that multiple "add X" commands properly append nodes
 */

const BACKEND_URL = "http://localhost:3000";
const OWNER_ID = "user_default";

async function testMultipleMutations() {
  console.log("🧪 Testing Multiple Workflow Mutations\n");

  // Step 1: Generate initial workflow
  console.log("📝 Step 1: Creating initial signup API workflow...");
  const workflowId = `workflow_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  
  const generateResponse = await fetch(`${BACKEND_URL}/workflow/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: "create signup api",
      workflowId,
      ownerId: OWNER_ID,
      correlationId: `test-gen-${Date.now()}`,
    }),
  });

  if (!generateResponse.ok) {
    console.error("❌ Failed to generate workflow:", await generateResponse.text());
    process.exit(1);
  }

  const initialWorkflow = await generateResponse.json();
  console.log(`✅ Initial workflow created`);
  console.log(`   - Node count: ${initialWorkflow.nodes?.length || 0}`);
  console.log(`   - Nodes: ${initialWorkflow.nodes?.map((n: any) => `${n.id}(${n.type})`).join(", ")}`);

  // Step 2: Add JWT
  console.log("\n📝 Step 2: Adding JWT...");
  
  const addJwtResponse = await fetch(`${BACKEND_URL}/workflow/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: "add jwt authentication",
      workflowId,
      ownerId: OWNER_ID,
      correlationId: `test-jwt-${Date.now()}`,
    }),
  });

  if (!addJwtResponse.ok) {
    console.error("❌ Failed to add JWT:", await addJwtResponse.text());
    process.exit(1);
  }

  const jwtWorkflow = await addJwtResponse.json();
  console.log(`✅ JWT added`);
  console.log(`   - Node count: ${jwtWorkflow.nodes?.length || 0}`);
  console.log(`   - Added: ${jwtWorkflow.metadata?.nodesAdded || 0} nodes`);

  // Step 3: Add email notification
  console.log("\n📝 Step 3: Adding email notification...");
  
  const addEmailResponse = await fetch(`${BACKEND_URL}/workflow/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: "send welcome email after signup",
      workflowId,
      ownerId: OWNER_ID,
      correlationId: `test-email-${Date.now()}`,
    }),
  });

  if (!addEmailResponse.ok) {
    console.error("❌ Failed to add email:", await addEmailResponse.text());
    process.exit(1);
  }

  const emailWorkflow = await addEmailResponse.json();
  console.log(`✅ Email notification added`);
  console.log(`   - Node count: ${emailWorkflow.nodes?.length || 0}`);
  console.log(`   - Added: ${emailWorkflow.metadata?.nodesAdded || 0} nodes`);

  // Step 4: Verify progression
  console.log("\n🔍 Step 4: Verifying progression...");
  
  const initialCount = initialWorkflow.nodes?.length || 0;
  const jwtCount = jwtWorkflow.nodes?.length || 0;
  const emailCount = emailWorkflow.nodes?.length || 0;

  console.log(`   - Initial: ${initialCount} nodes`);
  console.log(`   - After JWT: ${jwtCount} nodes (${jwtCount - initialCount > 0 ? '+' : ''}${jwtCount - initialCount})`);
  console.log(`   - After Email: ${emailCount} nodes (${emailCount - jwtCount > 0 ? '+' : ''}${emailCount - jwtCount})`);

  if (jwtCount > initialCount && emailCount > jwtCount) {
    console.log(`\n✅ SUCCESS: Workflow grew from ${initialCount} → ${jwtCount} → ${emailCount} nodes`);
    console.log(`   Total nodes added: ${emailCount - initialCount}`);
  } else {
    console.log(`\n❌ FAILURE: Workflow did not grow as expected`);
    process.exit(1);
  }

  // Step 5: Show final workflow
  console.log("\n📦 Final workflow nodes:");
  emailWorkflow.nodes?.forEach((node: any, idx: number) => {
    const isNew = node.data?._isNew ? " 🆕" : "";
    console.log(`   ${idx + 1}. ${node.id} (${node.type}): ${node.data?.label || "No label"}${isNew}`);
  });

  console.log("\n✅ All tests passed!");
}

testMultipleMutations().catch((error) => {
  console.error("❌ Test failed:", error);
  process.exit(1);
});
