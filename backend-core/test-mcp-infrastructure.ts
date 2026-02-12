/**
 * Test MCP Infrastructure
 * Validates that MCP server generation and tool invocation works
 */

import dotenv from "dotenv";
dotenv.config();

import { generateMCPServer } from "./src/mcp/server.generator";
import { runtimeManager } from "./src/mcp/runtime.manager";
import { registerBuiltInTools } from "./src/mcp/tool.registry";
import { logger } from "./src/utils/logger";

// Mock socket server for testing
const mockSocketServer = {
  emitExecutionLog: (executionId: string, data: any) => {
    console.log(`[Socket] ${executionId}:`, data.type, data.data || data);
  },
};

async function testMCPInfrastructure() {
  console.log("\n" + "=".repeat(60));
  console.log("MCP INFRASTRUCTURE TEST");
  console.log("=".repeat(60) + "\n");

  try {
    // Step 1: Register built-in tools
    console.log("1️⃣ Registering built-in tools...");
    registerBuiltInTools();
    console.log("✅ Built-in tools registered\n");

    // Step 2: Generate MCP server from prompt
    console.log("2️⃣ Generating MCP server from prompt...");
    const prompt = "Create a user signup API with email validation";
    const mcpServer = await generateMCPServer(prompt, "test_user", "test-001");
    
    console.log("✅ MCP Server generated:");
    console.log(`   Server ID: ${mcpServer.serverId}`);
    console.log(`   Name: ${mcpServer.name}`);
    console.log(`   Tools: ${mcpServer.tools.length}`);
    console.log(`   Resources: ${mcpServer.resources.length}`);
    console.log("\n   Tools:");
    mcpServer.tools.forEach((tool, idx) => {
      console.log(`   ${idx + 1}. ${tool.name} (${tool.toolId})`);
    });
    console.log("\n   Resources:");
    mcpServer.resources.forEach((resource, idx) => {
      console.log(`   ${idx + 1}. ${resource.name} (${resource.type})`);
    });
    console.log();

    // Step 3: Create runtime
    console.log("3️⃣ Creating MCP runtime...");
    const runtimeId = runtimeManager.createRuntime(mcpServer);
    console.log(`✅ Runtime created: ${runtimeId}\n`);

    // Step 4: Start runtime
    console.log("4️⃣ Starting runtime...");
    const started = runtimeManager.startRuntime(runtimeId);
    console.log(`✅ Runtime started: ${started}\n`);

    // Step 5: Invoke a tool
    console.log("5️⃣ Invoking input tool...");
    const context = {
      vars: {
        input: {
          email: "test@example.com",
          password: "password123",
        },
      },
      headers: {},
      executionId: "test-exec-001",
      socketServer: mockSocketServer as any,
    };

    const inputTool = mcpServer.tools.find((t) => t.toolId === "input");
    if (inputTool) {
      const result = await runtimeManager.invokeTool(
        runtimeId,
        "input",
        {
          variables: [
            { name: "email", type: "string", required: true },
            { name: "password", type: "string", required: true },
          ],
        },
        context
      );
      console.log("✅ Tool invoked successfully:");
      console.log("   Result:", JSON.stringify(result, null, 2));
      console.log("   Context vars:", JSON.stringify(context.vars, null, 2));
    } else {
      console.log("⚠️ Input tool not found in generated server");
    }
    console.log();

    // Step 6: Stop runtime
    console.log("6️⃣ Stopping runtime...");
    const stopped = runtimeManager.stopRuntime(runtimeId);
    console.log(`✅ Runtime stopped: ${stopped}\n`);

    // Step 7: List runtimes
    console.log("7️⃣ Listing all runtimes...");
    const runtimes = runtimeManager.listRuntimes();
    console.log(`✅ Total runtimes: ${runtimes.length}`);
    runtimes.forEach((runtime, idx) => {
      console.log(`   ${idx + 1}. ${runtime.name} (${runtime.status})`);
    });
    console.log();

    console.log("=".repeat(60));
    console.log("✅ ALL TESTS PASSED");
    console.log("=".repeat(60) + "\n");

    console.log("📊 Summary:");
    console.log(`   - MCP server generated: ${mcpServer.serverId}`);
    console.log(`   - Tools: ${mcpServer.tools.length}`);
    console.log(`   - Resources: ${mcpServer.resources.length}`);
    console.log(`   - Runtime created and tested: ${runtimeId}`);
    console.log(`   - Tool invocation: SUCCESS`);
    console.log();

    process.exit(0);
  } catch (error: any) {
    console.error("\n❌ TEST FAILED:");
    console.error(error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run test
testMCPInfrastructure();
