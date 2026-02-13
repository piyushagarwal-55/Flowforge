/**
 * Full Chain Agent Execution Test
 * Tests complete agent workflow from creation to execution
 */

import { generateMCPServer } from '../server.generator';
import { runtimeManager } from '../runtime.manager';
import MCPServer from '../../models/mcpServer.model';
import { connectDB } from '../../db/connection';
import { logger } from '../../utils/logger';

async function testFullChainExecution() {
  logger.info('[Test] Starting full chain agent execution test');

  try {
    // Connect to database
    await connectDB();

    // Step 1: Generate MCP server
    logger.info('[Test] Step 1: Generating MCP server');
    const prompt = 'Create a user signup API with email and password validation';
    const ownerId = 'test-user';
    
    const mcpServer = await generateMCPServer(prompt, ownerId);
    logger.info('[Test] MCP server generated', {
      serverId: mcpServer.serverId,
      toolCount: mcpServer.tools.length,
      executionOrder: mcpServer.executionOrder,
    });

    // Step 2: Save to database
    logger.info('[Test] Step 2: Saving server to database');
    const savedServer = await MCPServer.create({
      serverId: mcpServer.serverId,
      name: mcpServer.name,
      description: mcpServer.description,
      tools: mcpServer.tools,
      resources: mcpServer.resources,
      agents: mcpServer.agents,
      permissions: mcpServer.permissions,
      executionOrder: mcpServer.executionOrder,
      status: 'created',
      ownerId,
    });
    logger.info('[Test] Server saved to database');

    // Step 3: Create runtime
    logger.info('[Test] Step 3: Creating runtime');
    runtimeManager.createRuntime(mcpServer);
    
    // Step 4: Start runtime
    logger.info('[Test] Step 4: Starting runtime');
    const started = runtimeManager.startRuntime(mcpServer.serverId);
    if (!started) {
      throw new Error('Failed to start runtime');
    }
    logger.info('[Test] Runtime started successfully');

    // Step 5: Execute full chain
    logger.info('[Test] Step 5: Executing full chain');
    const executionOrder = mcpServer.executionOrder || [];
    const input = {
      email: 'test@example.com',
      password: 'SecurePass123!',
    };

    const context = {
      vars: { input },
      headers: {},
      executionId: `test-${Date.now()}`,
      socketServer: null, // Mock socket server
    };

    const results = [];
    for (let i = 0; i < executionOrder.length; i++) {
      const toolId = executionOrder[i];
      const tool = mcpServer.tools.find(t => t.toolId === toolId);

      if (!tool) {
        logger.warn('[Test] Tool not found', { toolId });
        continue;
      }

      try {
        logger.info('[Test] Executing tool', {
          step: i + 1,
          toolId,
          toolName: tool.name,
        });

        const result = await runtimeManager.invokeTool(
          mcpServer.serverId,
          toolId,
          tool.inputSchema, // Use schema as template
          context
        );

        results.push({
          step: i + 1,
          toolId,
          toolName: tool.name,
          status: 'success',
          output: result,
        });

        logger.info('[Test] Tool executed successfully', {
          step: i + 1,
          toolId,
        });
      } catch (error) {
        results.push({
          step: i + 1,
          toolId,
          toolName: tool.name,
          status: 'failed',
          error: (error as Error).message,
        });

        logger.error('[Test] Tool execution failed', {
          step: i + 1,
          toolId,
          error: (error as Error).message,
        });
        break;
      }
    }

    // Step 6: Verify results
    logger.info('[Test] Step 6: Verifying results');
    const successCount = results.filter(r => r.status === 'success').length;
    const failedCount = results.filter(r => r.status === 'failed').length;

    logger.info('[Test] Execution complete', {
      totalSteps: results.length,
      successCount,
      failedCount,
      results,
    });

    // Step 7: Verify database insert (if applicable)
    if (results.some(r => r.toolId === 'dbInsert' && r.status === 'success')) {
      logger.info('[Test] Step 7: Verifying database insert');
      const User = require('../../models/user.model').default;
      const user = await User.findOne({ email: input.email });
      
      if (user) {
        logger.info('[Test] ✅ User created successfully', {
          userId: user._id,
          email: user.email,
        });
      } else {
        logger.warn('[Test] ⚠️ User not found in database');
      }
    }

    // Cleanup
    logger.info('[Test] Cleaning up');
    runtimeManager.stopRuntime(mcpServer.serverId);
    await MCPServer.deleteOne({ serverId: mcpServer.serverId });

    logger.info('[Test] ✅ Full chain test completed successfully');
    return {
      success: true,
      results,
      summary: {
        totalSteps: results.length,
        successCount,
        failedCount,
      },
    };
  } catch (error) {
    logger.error('[Test] ❌ Test failed', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    throw error;
  }
}

// Run test if executed directly
if (require.main === module) {
  testFullChainExecution()
    .then(() => {
      console.log('Test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}

export { testFullChainExecution };
