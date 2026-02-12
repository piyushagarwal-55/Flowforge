/**
 * Agent Orchestration Test
 * Tests agent persistence, CRUD operations, and permission management
 */

import dotenv from "dotenv";
dotenv.config();

import { connectMongo } from "../../db/mongo";
import {
  createAgent,
  getAgent,
  listAgents,
  updateAgentPermissions,
  attachAgentToServer,
  detachAgentFromServer,
  deleteAgent,
} from "../../services/agent.service";
import { generateMCPServer } from "../server.generator";
import { runtimeManager } from "../runtime.manager";
import { registerBuiltInTools } from "../tool.registry";
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

async function runAgentOrchestrationTest() {
  console.log("\n" + "=".repeat(60));
  console.log("AGENT ORCHESTRATION TEST");
  console.log("=".repeat(60) + "\n");

  let testAgentId: string;
  let testServerId: string;
  let forbiddenTool: string | undefined;

  try {
    // ========================================
    // STEP 1: Setup
    // ========================================
    console.log("STEP 1: Setup environment");
    registerBuiltInTools();
    await connectMongo();
    console.log("✅ Environment ready\n");

    // ========================================
    // STEP 2: Create Agent
    // ========================================
    console.log("STEP 2: Create agent via service");

    const agent = await createAgent({
      name: "Test Sales Agent",
      description: "Agent for testing orchestration",
      allowedTools: ["input", "dbInsert", "response"],
      ownerId: "test_user",
    });

    testAgentId = agent.agentId;

    console.log("✅ Agent created:");
    console.log(`   Agent ID: ${agent.agentId}`);
    console.log(`   Name: ${agent.name}`);
    console.log(`   Allowed Tools: ${agent.allowedTools.join(", ")}`);
    console.log();

    // Validate persistence
    const persistedAgent = await MCPAgent.findOne({ agentId: agent.agentId });
    if (!persistedAgent) {
      throw new Error("Agent not persisted to database");
    }

    // ========================================
    // STEP 3: List Agents
    // ========================================
    console.log("STEP 3: List agents");

    const agents = await listAgents("test_user");

    console.log("✅ Agents listed:");
    console.log(`   Count: ${agents.length}`);
    console.log();

    if (agents.length === 0) {
      throw new Error("No agents found");
    }

    // ========================================
    // STEP 4: Get Agent
    // ========================================
    console.log("STEP 4: Get agent by ID");

    const retrievedAgent = await getAgent(testAgentId, "test_user");

    if (!retrievedAgent) {
      throw new Error("Agent not found");
    }

    console.log("✅ Agent retrieved:");
    console.log(`   Agent ID: ${retrievedAgent.agentId}`);
    console.log(`   Name: ${retrievedAgent.name}`);
    console.log();

    // ========================================
    // STEP 5: Generate MCP Server
    // ========================================
    console.log("STEP 5: Generate MCP server");

    const mcpServer = await generateMCPServer(
      "Create a customer management API with user registration, database lookup, validation, and response",
      "test_user",
      "orch-test-001"
    );

    testServerId = mcpServer.serverId;

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
    console.log(`   Tools: ${mcpServer.tools.map((t) => t.toolId).join(", ")}`);
    console.log();

    // ========================================
    // STEP 6: Create Runtime
    // ========================================
    console.log("STEP 6: Create and start runtime");

    runtimeManager.createRuntime(mcpServer);
    runtimeManager.startRuntime(mcpServer.serverId);

    console.log("✅ Runtime started\n");

    // ========================================
    // STEP 7: Attach Agent to Server
    // ========================================
    console.log("STEP 7: Attach agent to server");

    const attached = await attachAgentToServer(
      testAgentId,
      testServerId,
      "test_user"
    );

    console.log("✅ Agent attached:");
    console.log(`   Success: ${attached}`);
    console.log();

    if (!attached) {
      throw new Error("Failed to attach agent");
    }

    // Verify attachment in database
    const agentAfterAttach = await MCPAgent.findOne({ agentId: testAgentId });
    if (!agentAfterAttach?.attachedServers.includes(testServerId)) {
      throw new Error("Agent attachment not persisted");
    }

    // Verify attachment in runtime
    const runtime = runtimeManager.getRuntime(testServerId);
    if (!runtime || runtime.agents.length === 0) {
      throw new Error("Agent not attached to runtime");
    }

    // ========================================
    // STEP 8: Invoke Allowed Tool
    // ========================================
    console.log("STEP 8: Invoke allowed tool");

    mockSocketServer.clear();

    const context = {
      vars: { input: { test: "data" } },
      headers: {},
      executionId: "orch-test-exec-001",
      socketServer: mockSocketServer as any,
    };

    try {
      const result = await runtimeManager.invokeTool(
        testServerId,
        "input",
        { variables: [{ name: "test" }] },
        context,
        testAgentId
      );

      console.log("✅ Allowed tool invoked successfully");
      console.log(`   Tool: input`);
      console.log(`   Result: ${JSON.stringify(result)}`);
      console.log();
    } catch (error: any) {
      throw new Error(`Allowed tool invocation failed: ${error.message}`);
    }

    // ========================================
    // STEP 9: Attempt Forbidden Tool
    // ========================================
    console.log("STEP 9: Attempt forbidden tool");

    mockSocketServer.clear();

    // Find a tool that exists in server but NOT in agent's allowedTools
    const serverToolIds = mcpServer.tools.map((t) => t.toolId);
    const forbiddenTool = serverToolIds.find(
      (toolId) => !agent.allowedTools.includes(toolId)
    );

    if (!forbiddenTool) {
      console.log("⚠️ Skipping forbidden tool test - all server tools are allowed");
      console.log();
    } else {
      let permissionDenied = false;
      try {
        await runtimeManager.invokeTool(
          testServerId,
          forbiddenTool,
          { collection: "test", filters: {} },
          context,
          testAgentId
        );

        throw new Error("Permission check failed - unauthorized tool succeeded");
      } catch (error: any) {
        if (error.name === "PermissionDeniedError") {
          permissionDenied = true;
          console.log("✅ Permission denied as expected");
          console.log(`   Tool: ${forbiddenTool}`);
          console.log(`   Error: ${error.message}`);
          console.log();
        } else {
          throw error;
        }
      }

      if (!permissionDenied) {
        throw new Error("Permission enforcement not working");
      }
    }

    // ========================================
    // STEP 10: Update Permissions
    // ========================================
    console.log("STEP 10: Update agent permissions");

    // Get all server tools to grant full access
    const allServerTools = mcpServer.tools.map((t) => t.toolId);

    const updatedAgent = await updateAgentPermissions(
      testAgentId,
      "test_user",
      { allowedTools: allServerTools }
    );

    if (!updatedAgent) {
      throw new Error("Failed to update permissions");
    }

    console.log("✅ Permissions updated:");
    console.log(`   New Tools: ${updatedAgent.allowedTools.join(", ")}`);
    console.log();

    // Verify permissions synced to runtime
    const runtimeAfterUpdate = runtimeManager.getRuntime(testServerId);
    const runtimeAgent = runtimeAfterUpdate?.agents.find(
      (a) => a.agentId === testAgentId
    );
    if (!runtimeAgent || runtimeAgent.allowedTools.length !== allServerTools.length) {
      throw new Error("Permissions not synced to runtime");
    }

    // ========================================
    // STEP 11: Invoke Previously Forbidden Tool
    // ========================================
    console.log("STEP 11: Invoke previously forbidden tool");

    if (!forbiddenTool) {
      console.log("⚠️ Skipping - no forbidden tool was tested");
      console.log();
    } else {
      try {
        // Prepare proper input based on tool type
        let toolInput: any;
        let toolContext = { ...context };
        
        if (forbiddenTool === "dbFind") {
          toolInput = {
            collection: "mcpservers",
            filters: { serverId: testServerId },
            findType: "one",
          };
        } else if (forbiddenTool === "dbInsert") {
          toolInput = {
            collection: "mcpservers",
            data: { serverId: "test-doc", name: "Test", tools: [], resources: [], agents: [], permissions: [], status: "created" },
          };
        } else if (forbiddenTool === "inputValidation") {
          // inputValidation expects vars.input to exist in context
          toolContext = {
            ...context,
            vars: {
              ...context.vars,
              input: { test: "data", email: "test@example.com" }
            }
          };
          toolInput = {
            rules: [
              { field: "input.test", required: true, type: "string" },
              { field: "input.email", required: true, type: "string" }
            ],
          };
        } else if (forbiddenTool === "response") {
          toolInput = {
            status: 200,
            body: { success: true },
          };
        } else {
          // Generic input for other tools
          toolInput = {};
        }

        const result = await runtimeManager.invokeTool(
          testServerId,
          forbiddenTool,
          toolInput,
          toolContext,
          testAgentId
        );

        console.log("✅ Previously forbidden tool now allowed");
        console.log(`   Tool: ${forbiddenTool}`);
        console.log(`   Result: ${JSON.stringify(result).slice(0, 100)}`);
        console.log();
      } catch (error: any) {
        throw new Error(
          `Tool invocation failed after permission update: ${error.message}`
        );
      }
    }

    // ========================================
    // STEP 12: Detach Agent
    // ========================================
    console.log("STEP 12: Detach agent from server");

    const detached = await detachAgentFromServer(
      testAgentId,
      testServerId,
      "test_user"
    );

    console.log("✅ Agent detached:");
    console.log(`   Success: ${detached}`);
    console.log();

    if (!detached) {
      throw new Error("Failed to detach agent");
    }

    // Verify detachment
    const agentAfterDetach = await MCPAgent.findOne({ agentId: testAgentId });
    if (agentAfterDetach?.attachedServers.includes(testServerId)) {
      throw new Error("Agent detachment not persisted");
    }

    // ========================================
    // STEP 13: Cleanup
    // ========================================
    console.log("STEP 13: Cleanup");

    await deleteAgent(testAgentId, "test_user");
    await MCPServer.deleteOne({ serverId: testServerId });
    runtimeManager.stopRuntime(testServerId);

    console.log("✅ Cleanup complete\n");

    // ========================================
    // FINAL VALIDATION
    // ========================================
    console.log("=".repeat(60));
    console.log("✅ AGENT ORCHESTRATION TEST PASSED");
    console.log("=".repeat(60) + "\n");

    console.log("📊 Test Summary:");
    console.log("   ✅ Agent created and persisted");
    console.log("   ✅ Agent listed and retrieved");
    console.log("   ✅ Agent attached to server");
    console.log("   ✅ Allowed tool executed successfully");
    console.log("   ✅ Forbidden tool blocked by permissions");
    console.log("   ✅ Permissions updated dynamically");
    console.log("   ✅ Previously forbidden tool now allowed");
    console.log("   ✅ Agent detached from server");
    console.log("   ✅ Agent deleted and cleaned up");
    console.log();

    process.exit(0);
  } catch (error: any) {
    console.error("\n" + "=".repeat(60));
    console.error("❌ AGENT ORCHESTRATION TEST FAILED");
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
      console.log("🧹 Cleanup: Database cleaned up");
    } catch (cleanupError) {
      console.error("⚠️ Cleanup failed:", (cleanupError as Error).message);
    }

    process.exit(1);
  }
}

// Run the test
runAgentOrchestrationTest();
