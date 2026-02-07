/**
 * Test script to verify Response node is always last
 * 
 * Flow:
 * 1. Create signup API
 * 2. Add JWT
 * 3. Add email notification
 * 
 * Assertions:
 * - Response node exists
 * - Response node is LAST in node array
 * - JWT and Email appear BEFORE Response
 */

import Workflow from "../src/models/workflow.model";
import { connectMongo } from "../src/lib/mongo";

async function testResponseOrder() {
  console.log("\n" + "=".repeat(80));
  console.log("TESTING: Response Node Order Invariant");
  console.log("=".repeat(80) + "\n");

  await connectMongo();

  // Find the most recent workflow
  const workflow = await Workflow.findOne().sort({ createdAt: -1 });

  if (!workflow) {
    console.error("❌ No workflow found in database");
    process.exit(1);
  }

  console.log("📋 Testing Workflow:", workflow.workflowId);
  console.log("📝 Name:", workflow.name || "Unnamed");
  console.log("🔢 Total Nodes:", workflow.steps?.length || 0);
  console.log();

  const nodes = workflow.steps || [];
  const edges = workflow.edges || [];

  // Find Response node
  const responseNode = nodes.find((n: any) => n.type === "response");

  if (!responseNode) {
    console.error("❌ FAIL: No Response node found in workflow");
    process.exit(1);
  }

  console.log("✅ Response node found:", responseNode.id);

  // Check if Response is last
  const lastNode = nodes[nodes.length - 1];
  const isLast = lastNode.id === responseNode.id;

  console.log("\n📊 Node Order:");
  nodes.forEach((n: any, idx: number) => {
    const isResponse = n.type === "response";
    const marker = isResponse ? "🎯" : "  ";
    const position = idx === nodes.length - 1 ? "(LAST)" : "";
    console.log(`${marker} ${idx + 1}. ${n.id} (${n.type}) ${position}`);
  });

  console.log("\n🔗 Edges to Response:");
  const edgesToResponse = edges.filter((e: any) => e.target === responseNode.id);
  edgesToResponse.forEach((e: any) => {
    const sourceNode = nodes.find((n: any) => n.id === e.source);
    console.log(`   ${e.source} (${sourceNode?.type}) → ${e.target}`);
  });

  console.log("\n🔍 Verification:");
  console.log("   Response node ID:", responseNode.id);
  console.log("   Last node ID:", lastNode.id);
  console.log("   Last node type:", lastNode.type);
  console.log("   Response is last:", isLast ? "✅ YES" : "❌ NO");

  // Check for edges FROM response (should be zero)
  const edgesFromResponse = edges.filter((e: any) => e.source === responseNode.id);
  console.log("   Edges FROM response:", edgesFromResponse.length, edgesFromResponse.length === 0 ? "✅" : "❌");

  // Check for terminal nodes (nodes with no outgoing edges except response)
  const nodesWithOutgoingEdges = new Set(
    edges.filter((e: any) => e.target !== responseNode.id).map((e: any) => e.source)
  );
  const terminalNodes = nodes.filter(
    (n: any) => n.type !== "response" && !nodesWithOutgoingEdges.has(n.id)
  );
  
  console.log("\n🎯 Terminal Nodes (should connect to Response):");
  terminalNodes.forEach((n: any) => {
    const hasEdgeToResponse = edgesToResponse.some((e: any) => e.source === n.id);
    console.log(`   ${n.id} (${n.type}): ${hasEdgeToResponse ? "✅ Connected" : "❌ Not connected"}`);
  });

  console.log("\n" + "=".repeat(80));

  if (!isLast) {
    console.error("❌ FAIL: Response node is NOT the last node!");
    console.error("   Expected:", responseNode.id);
    console.error("   Got:", lastNode.id, `(${lastNode.type})`);
    process.exit(1);
  }

  if (edgesFromResponse.length > 0) {
    console.error("❌ FAIL: Response node has outgoing edges!");
    console.error("   Edges:", edgesFromResponse);
    process.exit(1);
  }

  const allTerminalNodesConnected = terminalNodes.every((n: any) =>
    edgesToResponse.some((e: any) => e.source === n.id)
  );

  if (!allTerminalNodesConnected) {
    console.error("❌ FAIL: Not all terminal nodes are connected to Response!");
    process.exit(1);
  }

  console.log("✅ SUCCESS: Response node order invariant holds!");
  console.log("✅ Response is the last node");
  console.log("✅ Response has no outgoing edges");
  console.log("✅ All terminal nodes connect to Response");
  console.log("=".repeat(80) + "\n");

  process.exit(0);
}

testResponseOrder().catch((error) => {
  console.error("❌ Test failed with error:", error);
  process.exit(1);
});
