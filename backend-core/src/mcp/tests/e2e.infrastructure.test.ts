/**
 * End-to-End MCP Infrastructure Validation Harness
 * 
 * This is a complete system-level test that simulates real platform usage:
 * - MCP server generation
 * - Runtime management
 * - Agent attachment
 * - Permission enforcement
 * - Tool execution
 * - Observability logging
 * - Database persistence
 */

import dotenv from "dotenv";
dotenv.config();

import { generateMCPServer } from "../server.generator";
import { runtimeManager } from "../runtime.manager";
import { registerBuiltInTools } from "../tool.registry";
import { connectMongo } from "../../db/mongo";
import MCPServerModel from "../../models/mcpServer.model";
import { MCPAgent, PermissionDeniedError } from "../schemas";

// Mock Socket Server for capturing events
class MockSocketServer {
  public events: any[] = [];

  emitExecutionLog(executionId: string, data: any) {
    this.events.push({
      executionId,
      timestamp: new Date().toISOString(),
      ...data,
    });
    console.log(`   [Socket Event] ${data.type}:`, data.data || data.error || "");
  }

  getEvents(type?: string): any[] {
    if (type) {
      return this.events.filter((e) => e.type === type);
    }
    return this.events;
  }

  clear() {
    this.events = [];
  }
}

const mockSocketServer = new MockSocketServer();

// Test state
let testServerId: string;
let testExecutionId: string;
let salesAgent: MCPAgent;
let supportAgent: MCPAgent;

async function runE2ETest() {
  console.log("\n" + "=".repeat(60));
  console.log("MCP END TO END INFRASTRUCTURE TEST");
  console.log("=".repeat(60) + "\n");

  try {
    // ========================================
    // STEP 1: Register Built-in MCP Tools
    // ========================================
    console.log("STEP 1: Register built-in MCP tools");
    registerBuiltInTools();
    console.log("✅ Built-in tools registered\n");

    // ========================================
    // STEP 2: Connect to MongoDB
    // ========================================
    console.log("STEP 2: Connect to MongoDB");
    await connectMongo();
    console.log("✅ MongoDB connected\n");

    // ========================================
    // STEP 3: Generate MCP Server from Prompt
    // ========================================
    console.log("STEP 3: Generate MCP server from natural language prompt");
    const prompt = "Create a customer management API with user lookup and registration";
    console.log(`   Prompt: "${prompt}"`);
    
    const mcpServer = await generateMCPServer(prompt, "test_user", "e2e-test-001");
    testServerId = mcpServer.serverId;
    
    console.log(`✅ MCP Server generated:`);
    console.log(`   Server ID: ${mcpServer.serverId}`);
    console.log(`   Name: ${mcpServer.name}`);
    console.log(`   Tools: ${mcpServer.tools.length}`);
    console.log(`   Resources: ${mcpServer.resources.length}`);
    console.log(`   Tool IDs: ${mcpServer.tools.map((t) => t.toolId).join(", ")}`);
    console.log(`   Tool Names: ${mcpServer.tools.map((t) => t.name).join(", ")}`);
    console.log();

    // Validate server structure
    if (!mcpServer.serverId || !mcpServer.name || mcpServer.tools.length === 0) {
      throw new Error("Invalid MCP server structure");
    }

    // ========================================
    // STEP 4: Persist MCP Server to MongoDB
    // ========================================
    console.log("STEP 4: Persist MCP server to MongoDB");
    
    await MCPServerModel.create({
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
    
    console.log("✅ MCP server persisted to MongoDB\n");

    // Verify persistence
    const persistedServer = await MCPServerModel.findOne({ serverId: mcpServer.serverId });
    if (!persistedServer) {
      throw new Error("Failed to persist MCP server to MongoDB");
    }

    // ========================================
    // STEP 5: Create Runtime
    // ========================================
    console.log("STEP 5: Create MCP runtime");
    
    const runtimeId = runtimeManager.createRuntime(mcpServer);
    
    console.log(`✅ Runtime created: ${runtimeId}\n`);

    if (runtimeId !== mcpServer.serverId) {
      throw new Error("Runtime ID mismatch");
    }

    // ========================================
    // STEP 6: Start Runtime
    // ========================================
    console.log("STEP 6: Start runtime");
    
    const started = runtimeManager.startRuntime(runtimeId);
    
    console.log(`✅ Runtime started: ${started}\n`);

    if (!started) {
      throw new Error("Failed to start runtime");
    }

    // Verify runtime status
    const runtime = runtimeManager.getRuntime(runtimeId);
    if (!runtime || runtime.status !== "running") {
      throw new Error("Runtime not in running state");
    }

    // ========================================
    // STEP 7: Create Two Agents
    // ========================================
    console.log("STEP 7: Create two agents");
    
    // Sales Agent - can insert and respond
    salesAgent = {
      agentId: "sales-agent-001",
      name: "Sales Agent",
      description: "Handles customer registration and sales",
      allowedTools: ["input", "dbInsert", "response"],
      createdAt: new Date(),
    };
    
    // Support Agent - can find and respond
    supportAgent = {
      agentId: "support-agent-001",
      name: "Support Agent",
      description: "Handles customer lookup and support",
      allowedTools: ["input", "dbFind", "response"],
      createdAt: new Date(),
    };
    
    console.log(`✅ Agents created:`);
    console.log(`   - ${salesAgent.name} (${salesAgent.agentId})`);
    console.log(`     Allowed tools: ${salesAgent.allowedTools.join(", ")}`);
    console.log(`   - ${supportAgent.name} (${supportAgent.agentId})`);
    console.log(`     Allowed tools: ${supportAgent.allowedTools.join(", ")}`);
    console.log();

    // ========================================
    // STEP 8: Attach Agents to MCP Server
    // ========================================
    console.log("STEP 8: Attach agents to MCP server");
    
    const salesAttached = runtimeManager.attachAgent(runtimeId, salesAgent);
    const supportAttached = runtimeManager.attachAgent(runtimeId, supportAgent);
    
    console.log(`✅ Agents attached:`);
    console.log(`   - Sales Agent: ${salesAttached}`);
    console.log(`   - Support Agent: ${supportAttached}`);
    console.log();

    if (!salesAttached || !supportAttached) {
      throw new Error("Failed to attach agents");
    }

    // Verify agents are attached
    const runtimeWithAgents = runtimeManager.getRuntime(runtimeId);
    if (!runtimeWithAgents || runtimeWithAgents.agents.length !== 2) {
      throw new Error("Agents not properly attached to runtime");
    }

    // ========================================
    // STEP 9: Invoke Authorized Tool (Sales Agent)
    // ========================================
    console.log("STEP 9: Invoke authorized tool (Sales Agent → dbInsert)");
    
    testExecutionId = "e2e-exec-001";
    mockSocketServer.clear();
    
    const context = {
      vars: {
        input: {
          email: "customer@example.com",
          name: "John Doe",
        },
      },
      headers: {},
      executionId: testExecutionId,
      socketServer: mockSocketServer as any,
    };

    // Sales agent should be able to call dbInsert
    try {
      const insertResult = await runtimeManager.invokeTool(
        runtimeId,
        "dbInsert",
        {
          collection: "mcpservers", // Use existing collection for test
          data: {
            serverId: "test-customer-001",
            name: "Test Customer",
            description: "Test customer record",
            tools: [],
            resources: [],
            agents: [],
            permissions: [],
            status: "created",
            ownerId: "test_user",
          },
          output: "createdCustomer",
        },
        context,
        salesAgent.agentId
      );
      
      console.log(`✅ Authorized tool invocation succeeded`);
      console.log(`   Agent: ${salesAgent.name}`);
      console.log(`   Tool: dbInsert`);
      console.log(`   Result: ${insertResult.success ? "Success" : "Failed"}`);
      console.log();
    } catch (error: any) {
      throw new Error(`Authorized tool invocation failed: ${error.message}`);
    }

    // ========================================
    // STEP 10: Capture Socket Logs
    // ========================================
    console.log("STEP 10: Validate socket event logs");
    
    const toolStartEvents = mockSocketServer.getEvents("tool_start");
    const toolCompleteEvents = mockSocketServer.getEvents("tool_complete");
    
    console.log(`✅ Socket events captured:`);
    console.log(`   - tool_start events: ${toolStartEvents.length}`);
    console.log(`   - tool_complete events: ${toolCompleteEvents.length}`);
    console.log();

    if (toolStartEvents.length === 0 || toolCompleteEvents.length === 0) {
      throw new Error("Socket events not properly emitted");
    }

    // ========================================
    // STEP 11: Invoke Authorized Tool (Support Agent)
    // ========================================
    console.log("STEP 11: Invoke authorized tool (Support Agent → dbFind)");
    
    mockSocketServer.clear();
    
    // Support agent should be able to call dbFind
    try {
      const findResult = await runtimeManager.invokeTool(
        runtimeId,
        "dbFind",
        {
          collection: "mcpservers", // Use existing collection for test
          filters: { serverId: "test-customer-001" },
          findType: "one",
          output: "foundCustomer",
        },
        context,
        supportAgent.agentId
      );
      
      console.log(`✅ Authorized tool invocation succeeded`);
      console.log(`   Agent: ${supportAgent.name}`);
      console.log(`   Tool: dbFind`);
      console.log(`   Result: ${findResult.found ? "Found" : "Not found"}`);
      console.log();
    } catch (error: any) {
      throw new Error(`Authorized tool invocation failed: ${error.message}`);
    }

    // ========================================
    // STEP 12: Attempt Forbidden Tool Call
    // ========================================
    console.log("STEP 12: Attempt forbidden tool call (Support Agent → dbInsert)");
    
    mockSocketServer.clear();
    
    // Support agent should NOT be able to call dbInsert
    let permissionDenied = false;
    try {
      await runtimeManager.invokeTool(
        runtimeId,
        "dbInsert",
        {
          collection: "mcpservers",
          data: { 
            serverId: "hacker-attempt",
            name: "Unauthorized",
            tools: [],
            resources: [],
            agents: [],
            permissions: [],
            status: "created",
          },
        },
        context,
        supportAgent.agentId
      );
      
      throw new Error("Permission check failed - unauthorized tool call succeeded!");
    } catch (error: any) {
      if (error instanceof PermissionDeniedError) {
        permissionDenied = true;
        console.log(`✅ Permission denied as expected`);
        console.log(`   Agent: ${supportAgent.name}`);
        console.log(`   Tool: dbInsert`);
        console.log(`   Error: ${error.message}`);
        console.log();
      } else {
        throw error;
      }
    }

    if (!permissionDenied) {
      throw new Error("Permission enforcement not working");
    }

    // ========================================
    // STEP 13: Validate Permission Denied Event
    // ========================================
    console.log("STEP 13: Validate permission denied socket event");
    
    const permissionDeniedEvents = mockSocketServer.getEvents("permission_denied");
    
    console.log(`✅ Permission denied event captured:`);
    console.log(`   - Events: ${permissionDeniedEvents.length}`);
    if (permissionDeniedEvents.length > 0) {
      console.log(`   - Agent: ${permissionDeniedEvents[0].data.agentId}`);
      console.log(`   - Tool: ${permissionDeniedEvents[0].data.toolId}`);
    }
    console.log();

    if (permissionDeniedEvents.length === 0) {
      throw new Error("Permission denied event not emitted");
    }

    // ========================================
    // STEP 14: Validate Invocation History
    // ========================================
    console.log("STEP 14: Validate invocation history");
    
    const invocations = runtimeManager.getInvocations(runtimeId);
    
    console.log(`✅ Invocation history retrieved:`);
    console.log(`   - Total invocations: ${invocations.length}`);
    console.log(`   - Successful: ${invocations.filter((i) => !i.error).length}`);
    console.log(`   - Failed: ${invocations.filter((i) => i.error).length}`);
    console.log();

    if (invocations.length < 2) {
      throw new Error("Invocation history incomplete");
    }

    // ========================================
    // STEP 15: Stop Runtime
    // ========================================
    console.log("STEP 15: Stop runtime");
    
    const stopped = runtimeManager.stopRuntime(runtimeId);
    
    console.log(`✅ Runtime stopped: ${stopped}\n`);

    if (!stopped) {
      throw new Error("Failed to stop runtime");
    }

    // Verify runtime status
    const stoppedRuntime = runtimeManager.getRuntime(runtimeId);
    if (!stoppedRuntime || stoppedRuntime.status !== "stopped") {
      throw new Error("Runtime not in stopped state");
    }

    // ========================================
    // STEP 16: Cleanup Database
    // ========================================
    console.log("STEP 16: Cleanup database");
    
    // Delete test MCP server
    await MCPServerModel.deleteOne({ serverId: mcpServer.serverId });
    
    // Delete test customer record if it was created
    await MCPServerModel.deleteOne({ serverId: "test-customer-001" });
    
    console.log(`✅ Database cleaned up\n`);

    // Verify cleanup
    const deletedServer = await MCPServerModel.findOne({ serverId: mcpServer.serverId });
    if (deletedServer) {
      throw new Error("Failed to cleanup database");
    }

    // ========================================
    // FINAL VALIDATION
    // ========================================
    console.log("=".repeat(60));
    console.log("✅ MCP INFRASTRUCTURE VERIFIED END TO END");
    console.log("=".repeat(60) + "\n");

    console.log("📊 Test Summary:");
    console.log(`   ✅ MCP server generated and persisted`);
    console.log(`   ✅ Runtime created and started`);
    console.log(`   ✅ Agents attached (${salesAgent.name}, ${supportAgent.name})`);
    console.log(`   ✅ Authorized tools executed successfully`);
    console.log(`   ✅ Unauthorized tool blocked by permissions`);
    console.log(`   ✅ Socket events emitted and captured`);
    console.log(`   ✅ Invocation history tracked`);
    console.log(`   ✅ Runtime stopped cleanly`);
    console.log(`   ✅ Database cleanup completed`);
    console.log();

    console.log("🎯 Platform Capabilities Validated:");
    console.log(`   ✅ MCP server generation from natural language`);
    console.log(`   ✅ Runtime lifecycle management`);
    console.log(`   ✅ Agent-based access control`);
    console.log(`   ✅ Permission enforcement`);
    console.log(`   ✅ Tool invocation with context`);
    console.log(`   ✅ Real-time observability`);
    console.log(`   ✅ Database persistence`);
    console.log();

    process.exit(0);
  } catch (error: any) {
    console.error("\n" + "=".repeat(60));
    console.error("❌ E2E TEST FAILED");
    console.error("=".repeat(60));
    console.error("\nError:", error.message);
    console.error("\nStack:", error.stack);
    console.error();

    // Cleanup on failure
    try {
      if (testServerId) {
        await MCPServerModel.deleteOne({ serverId: testServerId });
        await MCPServerModel.deleteOne({ serverId: "test-customer-001" });
        console.log("🧹 Cleanup: Database cleaned up");
      }
    } catch (cleanupError) {
      console.error("⚠️ Cleanup failed:", (cleanupError as Error).message);
    }

    process.exit(1);
  }
}

// Run the E2E test
runE2ETest();
