/**
 * Test script for workflow mutation
 * Tests that "add jwt" properly adds a new node to existing workflow
 */

const BACKEND_URL = "http://localhost:3000";
const OWNER_ID = "user_default";

async function testMutation() {
  console.log("🧪 Testing Workflow Mutation\n");

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
    const errorText = await generateResponse.text();
    console.error("❌ Failed to generate workflow:");
    console.error("   Status:", generateResponse.status);
    console.error("   Response:", errorText);
    process.exit(1);
  }

  const initialWorkflow = await generateResponse.json();
  console.log(`✅ Initial workflow created`);
  console.log(`   - Workflow ID: ${workflowId}`);
  console.log(`   - Node count: ${initialWorkflow.nodes?.length || 0}`);
  console.log(`   - Nodes: ${initialWorkflow.nodes?.map((n: any) => `${n.id}(${n.type})`).join(", ")}`);

  // Step 2: Mutate workflow to add JWT
  console.log("\n📝 Step 2: Adding JWT to workflow...");
  
  const mutateResponse = await fetch(`${BACKEND_URL}/workflow/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: "add jwt",
      workflowId,
      ownerId: OWNER_ID,
      correlationId: `test-mut-${Date.now()}`,
    }),
  });

  if (!mutateResponse.ok) {
    const errorText = await mutateResponse.text();
    console.error("❌ Failed to mutate workflow:");
    console.error("   Status:", mutateResponse.status);
    console.error("   Response:", errorText);
    process.exit(1);
  }

  const mutatedWorkflow = await mutateResponse.json();
  console.log(`✅ Workflow mutated`);
  console.log(`   - Node count: ${mutatedWorkflow.nodes?.length || 0}`);
  console.log(`   - Nodes: ${mutatedWorkflow.nodes?.map((n: any) => `${n.id}(${n.type})`).join(", ")}`);
  
  if (mutatedWorkflow.metadata) {
    console.log(`   - Mutation metadata:`);
    console.log(`     - Before: ${mutatedWorkflow.metadata.nodeCountBefore} nodes`);
    console.log(`     - After: ${mutatedWorkflow.metadata.nodeCountAfter} nodes`);
    console.log(`     - Added: ${mutatedWorkflow.metadata.nodesAdded} nodes`);
  }

  // Step 3: Verify mutation
  console.log("\n🔍 Step 3: Verifying mutation...");
  
  const nodeCountBefore = initialWorkflow.nodes?.length || 0;
  const nodeCountAfter = mutatedWorkflow.nodes?.length || 0;
  const nodesAdded = nodeCountAfter - nodeCountBefore;

  if (nodesAdded > 0) {
    console.log(`✅ SUCCESS: ${nodesAdded} node(s) added`);
    
    // Show new nodes
    const initialNodeIds = new Set(initialWorkflow.nodes?.map((n: any) => n.id) || []);
    const newNodes = mutatedWorkflow.nodes?.filter((n: any) => !initialNodeIds.has(n.id)) || [];
    
    if (newNodes.length > 0) {
      console.log(`\n📦 New nodes added:`);
      newNodes.forEach((node: any) => {
        console.log(`   - ${node.id} (${node.type}): ${node.data?.label || "No label"}`);
      });
    }
  } else {
    console.log(`❌ FAILURE: No nodes were added (expected at least 1)`);
    console.log(`   - Before: ${nodeCountBefore} nodes`);
    console.log(`   - After: ${nodeCountAfter} nodes`);
    process.exit(1);
  }

  console.log("\n✅ All tests passed!");
}

testMutation().catch((error) => {
  console.error("❌ Test failed:", error);
  process.exit(1);
});
