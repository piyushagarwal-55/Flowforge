/**
 * Platform Integration Test
 * End-to-end test of MCP platform integration with FlowForge
 */

import dotenv from "dotenv";
dotenv.config();

import { connectMongo } from "../../db/mongo";
import { generateMCPServer } from "../server.generator";
import { createAgent, attachAgentToServer } from "../../services/agent.service";
import { runtimeManager } from "../runtime.manager";
import { registerBuiltInTools } from "../tool.registry";
import { eventRingBuffer } from "../../services/eventRingBuffer";
import MCPAgent from "../../models/mcpAgent.model";
import MCPServer from "../../models/mcpServer.model";

// Mock Socket Server
class MockSocketServer {
  public events: any[] = [];

  emitExecutionLog(executionId: string, data: any) {
    this.events.push({ executionId, ...data });
  }

  getEvents(type?: string): any[] {
    return type ? this.events.filter((e) => e.type === type) : this.events;
  }

  clear() {
    this.events = [];
  }
}

const mockSocketServer = new MockSocketServer();

async function runPlatformIntegrationTest() {
  console.log("\n" + "=".repeat(60));
  console.log("PLATFORM INTEGRATION TEST");
  console.log("=".repeat(60) + "\n");

  let testServerId: string;
  let testAgentId: string;

  try {
    // ========================================
    // STEP 1: Setup
    // ========================================
    console.log("STEP 1: Setup environment");
    registerBuiltInTools();
    await connectMongo();
    eventRingBuffer.clear();
    console.log("✅ Environment ready\n");

    // ========================================
    // STEP 2: Generate MCP Server
    // ========================================
    console.log("STEP 2: Generate MCP server from prompt");

    const mcpServer = await generateMCPServer(
      "Create a user registration API with validation and database storage",
      "test_user",
      "platform-test-001"
    );

    testServerId = mcpServer.serverId;

    // Save to database
    await MCPServer.create({
      serverId: mcpServer.serverId,
      name: mcpServer.name,
      description: mcpServer.description,
      tools: mcpServer.tools,
      resources: mcpServer.resources,
      agents: mcpServer.agents,
      permissions: mcpServer.permissions,
      status: mcpServer.status,
      ownerId: mcpServer.ownerId,
    });

    console.log("✅ MCP server generated:");
    console.log(`   Server ID: ${mcpServer.serverId}`);
    console.log(`   Name: ${mcpServer.name}`);
    console.log(`   Tools: ${mcpServer.tools.map((t) => t.toolId).join(", ")}`);
    console.log();

    // ========================================
    // STEP 3: Create Runtime (BEFORE agent attachment)
    // ========================================
    console.log("STEP 3: Create runtime");

    runtimeManager.createRuntime(mcpServer);

    console.log("✅ Runtime created\n");

    // ========================================
    // STEP 4: Create Agent
    // ========================================
    console.log("STEP 4: Create agent");

    const agent = await createAgent({
      name: "Registration Agent",
      description: "Handles user registration",
      allowedTools: mcpServer.tools.map((t) => t.toolId),
      ownerId: "test_user",
    });

    testAgentId = agent.agentId;

    console.log("✅ Agent created:");
    console.log(`   Agent ID: ${agent.agentId}`);
    console.log(`   Name: ${agent.name}`);
    console.log();

    // ========================================
    // STEP 5: Attach Agent to Server
    // ========================================
    console.log("STEP 5: Attach agent to server");

    await attachAgentToServer(testAgentId, testServerId, "test_user");

    console.log("✅ Agent attached to server\n");

    // ========================================
    // STEP 6: Start Runtime
    // ========================================
    console.log("STEP 6: Start runtime");

    runtimeManager.startRuntime(testServerId);

    console.log("✅ Runtime started\n");

    // Verify runtime started event in ring buffer
    const startEvents = eventRingBuffer.getByType("runtime_started");
    if (startEvents.length === 0) {
      throw new Error("Runtime started event not logged");
    }

    console.log("✅ Runtime started event logged\n");

    // ========================================
    // STEP 7: Invoke Tool
    // ========================================
    console.log("STEP 7: Invoke tool");

    const context = {
      vars: {},
      headers: {},
      executionId: "platform-test-exec-001",
      socketServer: mockSocketServer as any,
    };

    // Find first tool
    const firstTool = mcpServer.tools[0];

    // Prepare input based on tool type
    let toolInput: any = {};
    if (firstTool.toolId === "input") {
      toolInput = { variables: [{ name: "test" }] };
    } else if (firstTool.toolId === "inputValidation") {
      context.vars = { input: { test: "data" } };
      toolInput = {
        rules: [{ field: "input.test", required: true, type: "string" }],
      };
    }

    const result = await runtimeManager.invokeTool(
      testServerId,
      firstTool.toolId,
      toolInput,
      context,
      testAgentId
    );

    console.log("✅ Tool invoked successfully:");
    console.log(`   Tool: ${firstTool.toolId}`);
    console.log(`   Result: ${JSON.stringify(result).slice(0, 100)}`);
    console.log();

    // Verify tool invoked event in ring buffer
    const invokeEvents = eventRingBuffer.getByType("tool_invoked");
    if (invokeEvents.length === 0) {
      throw new Error("Tool invoked event not logged");
    }

    console.log("✅ Tool invoked event logged\n");

    // Verify tool completed event in ring buffer
    const completeEvents = eventRingBuffer.getByType("tool_completed");
    if (completeEvents.length === 0) {
      throw new Error("Tool completed event not logged");
    }

    console.log("✅ Tool completed event logged\n");

    // ========================================
    // STEP 8: Verify Event Ring Buffer
    // ========================================
    console.log("STEP 8: Verify event ring buffer");

    const allEvents = eventRingBuffer.getRecent(100);

    console.log("✅ Event ring buffer populated:");
    console.log(`   Total events: ${allEvents.length}`);
    console.log(`   Event types: ${[...new Set(allEvents.map((e) => e.type))].join(", ")}`);
    console.log();

    if (allEvents.length < 3) {
      throw new Error("Expected at least 3 events in ring buffer");
    }

    // ========================================
    // STEP 9: Fetch Topology
    // ========================================
    console.log("STEP 9: Verify topology data");

    // Simulate topology fetch
    const servers = await MCPServer.find({ ownerId: "test_user" });
    const agents = await MCPAgent.find({ ownerId: "test_user" });

    console.log("✅ Topology data available:");
    console.log(`   Servers: ${servers.length}`);
    console.log(`   Agents: ${agents.length}`);
    console.log();

    if (servers.length === 0 || agents.length === 0) {
      throw new Error("Topology data incomplete");
    }

    // ========================================
    // STEP 10: Stop Runtime
    // ========================================
    console.log("STEP 10: Stop runtime");

    runtimeManager.stopRuntime(testServerId);

    console.log("✅ Runtime stopped\n");

    // Verify runtime stopped event in ring buffer
    const stopEvents = eventRingBuffer.getByType("runtime_stopped");
    if (stopEvents.length === 0) {
      throw new Error("Runtime stopped event not logged");
    }

    console.log("✅ Runtime stopped event logged\n");

    // ========================================
    // STEP 11: Cleanup
    // ========================================
    console.log("STEP 11: Cleanup");

    await MCPAgent.deleteOne({ agentId: testAgentId });
    await MCPServer.deleteOne({ serverId: testServerId });
    eventRingBuffer.clear();

    console.log("✅ Cleanup complete\n");

    // ========================================
    // FINAL VALIDATION
    // ========================================
    console.log("=".repeat(60));
    console.log("✅ PLATFORM INTEGRATION TEST PASSED");
    console.log("=".repeat(60) + "\n");

    console.log("📊 Test Summary:");
    console.log("   ✅ MCP server generated from prompt");
    console.log("   ✅ Agent created and attached");
    console.log("   ✅ Runtime started successfully");
    console.log("   ✅ Tool invoked with agent permissions");
    console.log("   ✅ Events logged to ring buffer");
    console.log("   ✅ Topology data available");
    console.log("   ✅ Runtime stopped successfully");
    console.log("   ✅ All telemetry events captured");
    console.log();

    console.log("🎉 FlowForge MCP Platform Integration Complete!");
    console.log();

    process.exit(0);
  } catch (error: any) {
    console.error("\n" + "=".repeat(60));
    console.error("❌ PLATFORM INTEGRATION TEST FAILED");
    console.error("=".repeat(60));
    console.error("\nError:", error.message);
    console.error("\nStack:", error.stack);
    console.error();

    // Cleanup on failure
    try {
      if (testAgentId) {
        await MCPAgent.deleteOne({ agentId: testAgentId });
      }
      if (testServerId) {
        await MCPServer.deleteOne({ serverId: testServerId });
        runtimeManager.stopRuntime(testServerId);
      }
      eventRingBuffer.clear();
      console.log("🧹 Cleanup: Database cleaned up");
    } catch (cleanupError) {
      console.error("⚠️ Cleanup failed:", (cleanupError as Error).message);
    }

    process.exit(1);
  }
}

// Run the test
runPlatformIntegrationTest();
