/**
 * SupervisorAgent - THIN wrapper for AI intent handling
 * 
 * This is a minimal orchestration layer that:
 * 1. Receives user prompts
 * 2. Creates task objects for tracking
 * 3. Determines if request is creation or mutation
 * 4. Routes to existing services (NO internal logic changes)
 * 5. Returns results unchanged
 * 
 * CRITICAL: This agent does NOT modify any generation/mutation logic.
 * It simply forwards to existing functions.
 */

import { randomUUID } from 'crypto';
import Workflow from '../models/workflow.model';
import MCPServer from '../models/mcpServer.model';
import { generateMCPServer, mutateMCPServer } from '../mcp/server.generator';
import { runtimeManager } from '../mcp/runtime.manager';
import { logger } from '../utils/logger';
import { SocketServer } from '../socket';

/**
 * Task object for tracking user requests
 */
export interface SupervisorTask {
  taskId: string;
  goal: string;
  workflowId?: string;
  ownerId: string;
  correlationId: string;
  status: 'received' | 'routing' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  error?: string;
}

/**
 * Input parameters for handleUserIntent
 */
export interface HandleUserIntentInput {
  prompt: string;
  workflowId?: string;
  ownerId: string;
  correlationId?: string;
  socketServer?: SocketServer;
  executionId?: string;
}

/**
 * Result from handleUserIntent
 */
export interface HandleUserIntentResult {
  task: SupervisorTask;
  result: any; // Result from underlying service (unchanged)
  isMutation: boolean;
  supervisorLogs: string[]; // Logs for frontend display
}

/**
 * SupervisorAgent class - THIN WRAPPER ONLY
 */
export class SupervisorAgent {
  /**
   * Handle user intent - THIN WRAPPER
   * Just routes to existing functions, no logic changes
   */
  async handleUserIntent(input: HandleUserIntentInput): Promise<HandleUserIntentResult> {
    const { prompt, workflowId, ownerId, correlationId, socketServer, executionId } = input;
    const finalCorrelationId = correlationId || `supervisor-${Date.now()}`;
    const finalExecutionId = executionId || workflowId || finalCorrelationId;

    // Collect logs for frontend
    const supervisorLogs: string[] = [];

    // Create task object for tracking
    const task: SupervisorTask = {
      taskId: randomUUID(),
      goal: prompt,
      workflowId,
      ownerId,
      correlationId: finalCorrelationId,
      status: 'received',
      createdAt: new Date(),
    };

    logger.info('[SupervisorAgent] Supervisor received task', {
      taskId: task.taskId,
      goal: prompt.slice(0, 100),
      workflowId,
      ownerId,
      correlationId: finalCorrelationId,
    });
    supervisorLogs.push(`🧠 Supervisor received task: ${task.taskId.slice(0, 8)}`);

    // Emit agent activity log
    if (socketServer) {
      socketServer.emitExecutionLog(finalExecutionId, {
        type: 'step_start',
        stepType: 'agent',
        stepName: 'SupervisorAgent',
        data: { message: '🧠 SupervisorAgent received task', agent: 'SupervisorAgent' },
        timestamp: new Date().toISOString(),
        serverId: workflowId?.includes('mcp_') ? workflowId.match(/mcp_\d+_[a-f0-9]+/)?.[0] : undefined,
        workflowId,
        ownerId,
      });
    }

    try {
      task.status = 'routing';

      // Determine if this is a mutation or creation
      let isMutation = false;
      let existingServer = null;

      if (workflowId) {
        // Check for MCP server (extract serverId from workflowId pattern)
        const serverIdMatch = workflowId.match(/mcp_workflow_(mcp_\d+_[a-f0-9]+)_\d+/);
        if (serverIdMatch) {
          const serverId = serverIdMatch[1];
          existingServer = await MCPServer.findOne({ serverId, ownerId });
          
          if (existingServer && existingServer.tools && existingServer.tools.length > 0) {
            isMutation = true;
          }
        }

        // Also check workflow collection
        if (!isMutation) {
          const existingWorkflow = await Workflow.findOne({ workflowId, ownerId });
          if (existingWorkflow && existingWorkflow.steps && existingWorkflow.steps.length > 0) {
            isMutation = true;
          }
        }
      }

      let result: any;

      if (isMutation && existingServer) {
        // Route to mutation - call existing function
        logger.info('[SupervisorAgent] Supervisor routing to workflow mutation', {
          taskId: task.taskId,
          serverId: existingServer.serverId,
        });
        supervisorLogs.push(`🔄 Routing to workflow mutation (${existingServer.tools.length} existing tools)`);

        // Emit agent activity log
        if (socketServer) {
          socketServer.emitExecutionLog(finalExecutionId, {
            type: 'step_start',
            stepType: 'agent',
            stepName: 'BuilderAgent',
            data: { message: '🏗 BuilderAgent mutating workflow', agent: 'BuilderAgent' },
            timestamp: new Date().toISOString(),
            serverId: existingServer.serverId,
            workflowId,
            ownerId,
          });
        }

        // Call existing mutateMCPServer function (NO changes to its logic)
        result = await mutateMCPServer(existingServer, prompt, finalCorrelationId, socketServer, finalExecutionId);
        supervisorLogs.push(`✅ Mutation completed: ${result.tools.length} tools`);

        // Update database (existing logic)
        await MCPServer.findOneAndUpdate(
          { serverId: result.serverId, ownerId },
          {
            tools: result.tools,
            executionOrder: result.executionOrder,
            updatedAt: new Date(),
          }
        );

        // Update runtime if exists (existing logic)
        const runtime = runtimeManager.getRuntime(result.serverId);
        if (runtime) {
          // Emit runtime update log
          if (socketServer) {
            socketServer.emitExecutionLog(finalExecutionId, {
              type: 'step_start',
              stepType: 'agent',
              stepName: 'MCPRuntime',
              data: { message: '🔧 MCPRuntime applying updated tool graph', agent: 'MCPRuntime' },
              timestamp: new Date().toISOString(),
              serverId: result.serverId,
              workflowId,
              ownerId,
            });
          }

          const wasRunning = runtime.status === 'running';
          runtimeManager.createRuntime(result);
          if (wasRunning) {
            runtimeManager.startRuntime(result.serverId);
            supervisorLogs.push(`🔄 Runtime restarted`);
          }
        }

      } else {
        // Route to creation - call existing function
        logger.info('[SupervisorAgent] Supervisor routing to workflow creation', {
          taskId: task.taskId,
        });
        supervisorLogs.push(`🆕 Routing to workflow creation`);

        // Emit agent activity log
        if (socketServer) {
          socketServer.emitExecutionLog(finalExecutionId, {
            type: 'step_start',
            stepType: 'agent',
            stepName: 'BuilderAgent',
            data: { message: '🏗 BuilderAgent generating workflow', agent: 'BuilderAgent' },
            timestamp: new Date().toISOString(),
            serverId: undefined, // Will be set after generation
            workflowId,
            ownerId,
          });
        }

        // Call existing generateMCPServer function (NO changes to its logic)
        result = await generateMCPServer(prompt, ownerId, finalCorrelationId, socketServer, finalExecutionId);
        supervisorLogs.push(`✅ Created MCP server: ${result.tools.length} tools`);

        // Emit runtime creation log
        if (socketServer) {
          socketServer.emitExecutionLog(finalExecutionId, {
            type: 'step_start',
            stepType: 'agent',
            stepName: 'MCPRuntime',
            data: { message: '🔧 MCPRuntime initializing tool graph', agent: 'MCPRuntime' },
            timestamp: new Date().toISOString(),
            serverId: result.serverId,
            workflowId,
            ownerId,
          });
        }

        // Create runtime (existing logic)
        runtimeManager.createRuntime(result);
        supervisorLogs.push(`🚀 Runtime initialized`);
      }

      task.status = 'completed';
      task.completedAt = new Date();

      logger.info('[SupervisorAgent] Task completed successfully', {
        taskId: task.taskId,
        isMutation,
        duration: task.completedAt.getTime() - task.createdAt.getTime(),
      });
      supervisorLogs.push(`✅ Task completed in ${task.completedAt.getTime() - task.createdAt.getTime()}ms`);

      // Emit completion log
      if (socketServer) {
        socketServer.emitExecutionLog(finalExecutionId, {
          type: 'step_complete',
          stepType: 'agent',
          stepName: 'SupervisorAgent',
          data: { message: '✅ SupervisorAgent completed task', agent: 'SupervisorAgent' },
          timestamp: new Date().toISOString(),
          serverId: result?.serverId,
          workflowId,
          ownerId,
        });
      }

      return {
        task,
        result,
        isMutation,
        supervisorLogs,
      };
    } catch (error) {
      task.status = 'failed';
      task.error = (error as Error).message;
      task.completedAt = new Date();

      logger.error('[SupervisorAgent] Task failed', {
        taskId: task.taskId,
        error: (error as Error).message,
        stack: (error as Error).stack,
      });
      supervisorLogs.push(`❌ Task failed: ${(error as Error).message}`);

      throw error;
    }
  }
}

// Export singleton instance
export const supervisorAgent = new SupervisorAgent();
