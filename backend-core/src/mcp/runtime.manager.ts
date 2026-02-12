/**
 * MCP Runtime Manager
 * Manages active MCP servers and tool invocations
 */

import { v4 as uuidv4 } from "uuid";
import { MCPServer, MCPToolInvocation, MCPAgent, PermissionDeniedError } from "./schemas";
import { toolRegistry } from "./tool.registry";
import { logger } from "../utils/logger";
import { SocketServer } from "../socket";

interface RuntimeContext {
  vars: Record<string, any>;
  headers: Record<string, any>;
  executionId: string;
  socketServer: SocketServer;
}

class RuntimeManager {
  private runtimes: Map<string, MCPServer> = new Map();
  private invocations: Map<string, MCPToolInvocation> = new Map();

  /**
   * Create a new MCP runtime from server definition
   */
  createRuntime(serverDefinition: MCPServer): string {
    const { serverId } = serverDefinition;

    if (this.runtimes.has(serverId)) {
      logger.warn(`Runtime ${serverId} already exists, overwriting`);
    }

    const runtime: MCPServer = {
      ...serverDefinition,
      status: "created",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.runtimes.set(serverId, runtime);
    logger.info(`Runtime created: ${serverId} (${runtime.name})`);

    return serverId;
  }

  /**
   * Start an MCP runtime
   */
  startRuntime(serverId: string): boolean {
    const runtime = this.runtimes.get(serverId);

    if (!runtime) {
      logger.error(`Runtime ${serverId} not found`);
      return false;
    }

    runtime.status = "running";
    runtime.updatedAt = new Date();

    logger.info(`Runtime started: ${serverId}`);
    return true;
  }

  /**
   * Stop an MCP runtime
   */
  stopRuntime(serverId: string): boolean {
    const runtime = this.runtimes.get(serverId);

    if (!runtime) {
      logger.error(`Runtime ${serverId} not found`);
      return false;
    }

    runtime.status = "stopped";
    runtime.updatedAt = new Date();

    logger.info(`Runtime stopped: ${serverId}`);
    return true;
  }

  /**
   * Get a runtime by ID
   */
  getRuntime(serverId: string): MCPServer | undefined {
    return this.runtimes.get(serverId);
  }

  /**
   * List all runtimes
   */
  listRuntimes(): MCPServer[] {
    return Array.from(this.runtimes.values());
  }

  /**
   * Delete a runtime
   */
  deleteRuntime(serverId: string): boolean {
    const runtime = this.runtimes.get(serverId);
    if (runtime) {
      runtime.status = "stopped";
    }
    return this.runtimes.delete(serverId);
  }

  /**
   * Attach an agent to a server
   */
  attachAgent(serverId: string, agent: MCPAgent): boolean {
    const runtime = this.runtimes.get(serverId);

    if (!runtime) {
      logger.error(`Runtime ${serverId} not found`);
      return false;
    }

    // Check if agent already attached
    const existingAgent = runtime.agents.find((a) => a.agentId === agent.agentId);
    if (existingAgent) {
      logger.warn(`Agent ${agent.agentId} already attached to server ${serverId}`);
      return false;
    }

    // Attach agent
    runtime.agents.push({ ...agent, serverId });
    runtime.updatedAt = new Date();

    logger.info(`Agent attached: ${agent.agentId} to server ${serverId}`);
    return true;
  }

  /**
   * Check if agent has permission to use tool
   */
  private checkPermission(serverId: string, agentId: string, toolId: string): boolean {
    const runtime = this.runtimes.get(serverId);
    if (!runtime) return false;

    // Find agent
    const agent = runtime.agents.find((a) => a.agentId === agentId);
    if (!agent) {
      logger.warn(`Agent ${agentId} not found in server ${serverId}`);
      return false;
    }

    // Check if tool is in agent's allowed tools
    const hasPermission = agent.allowedTools.includes(toolId);
    
    logger.debug(`Permission check: agent=${agentId}, tool=${toolId}, allowed=${hasPermission}`);
    
    return hasPermission;
  }

  /**
   * Invoke an MCP tool within a runtime
   */
  async invokeTool(
    serverId: string,
    toolId: string,
    input: any,
    context: RuntimeContext,
    agentId?: string
  ): Promise<any> {
    const runtime = this.runtimes.get(serverId);

    if (!runtime) {
      throw new Error(`Runtime ${serverId} not found`);
    }

    if (runtime.status !== "running") {
      throw new Error(`Runtime ${serverId} is not running (status: ${runtime.status})`);
    }

    // Check agent permissions if agentId provided
    if (agentId) {
      const hasPermission = this.checkPermission(serverId, agentId, toolId);
      if (!hasPermission) {
        const error = new PermissionDeniedError(agentId, toolId, serverId);
        
        // Emit permission denied event
        context.socketServer.emitExecutionLog(context.executionId, {
          type: "permission_denied",
          timestamp: new Date().toISOString(),
          data: {
            agentId,
            toolId,
            serverId,
            error: error.message,
          },
        });

        logger.error(`Permission denied: ${error.message}`);
        throw error;
      }
    }

    // Get tool from registry
    const tool = toolRegistry.getTool(toolId);

    if (!tool) {
      throw new Error(`Tool ${toolId} not found in registry`);
    }

    // Check if tool is registered in this server
    const serverTool = runtime.tools.find((t) => t.toolId === toolId);
    if (!serverTool) {
      throw new Error(`Tool ${toolId} not registered in server ${serverId}`);
    }

    // Create invocation record
    const invocationId = uuidv4();
    const invocation: MCPToolInvocation = {
      invocationId,
      serverId,
      toolId,
      agentId,
      input,
      startedAt: new Date(),
    };

    this.invocations.set(invocationId, invocation);

    // Emit tool invocation start
    context.socketServer.emitExecutionLog(context.executionId, {
      type: "tool_start",
      timestamp: new Date().toISOString(),
      data: {
        invocationId,
        toolId,
        toolName: tool.name,
        input,
      },
    });

    logger.info(`Tool invocation started: ${toolId} (${invocationId})`);

    try {
      // Invoke tool handler
      const startTime = Date.now();
      const output = await tool.handler(input, context);
      const durationMs = Date.now() - startTime;

      // Update invocation record
      invocation.output = output;
      invocation.completedAt = new Date();
      invocation.durationMs = durationMs;

      // Emit tool invocation complete
      context.socketServer.emitExecutionLog(context.executionId, {
        type: "tool_complete",
        timestamp: new Date().toISOString(),
        data: {
          invocationId,
          toolId,
          toolName: tool.name,
          output,
          durationMs,
        },
      });

      logger.info(`Tool invocation completed: ${toolId} (${invocationId}) in ${durationMs}ms`);

      return output;
    } catch (error: any) {
      // Update invocation record with error
      invocation.error = error.message || "Unknown error";
      invocation.completedAt = new Date();
      invocation.durationMs = Date.now() - invocation.startedAt.getTime();

      // Emit tool invocation error
      context.socketServer.emitExecutionLog(context.executionId, {
        type: "tool_error",
        timestamp: new Date().toISOString(),
        data: {
          invocationId,
          toolId,
          toolName: tool.name,
          error: error.message || "Unknown error",
          durationMs: invocation.durationMs,
        },
      });

      logger.error(`Tool invocation failed: ${toolId} (${invocationId})`, {
        error: error.message,
      });

      throw error;
    }
  }

  /**
   * Get invocation history
   */
  getInvocations(serverId?: string): MCPToolInvocation[] {
    const invocations = Array.from(this.invocations.values());
    if (serverId) {
      return invocations.filter((inv) => inv.serverId === serverId);
    }
    return invocations;
  }

  /**
   * Clear all runtimes and invocations
   */
  clear(): void {
    this.runtimes.clear();
    this.invocations.clear();
  }
}

// Singleton instance
export const runtimeManager = new RuntimeManager();
