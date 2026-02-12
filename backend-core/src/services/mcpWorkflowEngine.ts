/**
 * MCP Workflow Engine
 * Executes workflows using MCP runtime infrastructure
 * Replaces direct workflow execution with MCP tool invocations
 */

import { v4 as uuidv4 } from "uuid";
import { connectMongo } from "../db/mongo";
import { logger } from "../utils/logger";
import { SocketServer } from "../socket";
import { runtimeManager } from "../mcp/runtime.manager";
import { toolRegistry, registerBuiltInTools } from "../mcp/tool.registry";
import { MCPServer } from "../mcp/schemas";

// Ensure built-in tools are registered
registerBuiltInTools();

interface WorkflowNode {
  id: string;
  type: string;
  data: {
    label?: string;
    fields?: Record<string, any>;
  };
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
}

/**
 * Execute workflow using MCP runtime
 * This is the new execution path: Chat → MCP Server → Runtime Manager → Tool Invocation
 */
export async function runMCPEngine(
  steps: WorkflowNode[],
  edges: WorkflowEdge[],
  input: any,
  headers: any = {},
  executionId: string,
  socketServer: SocketServer,
  serverId?: string
) {
  logger.info("MCP Workflow engine started", {
    executionId,
    stepCount: steps.length,
    serverId,
  });

  await connectMongo();

  // Create or get MCP runtime
  const runtimeId = serverId || `runtime_${executionId}`;
  let runtime = runtimeManager.getRuntime(runtimeId);

  if (!runtime) {
    // Create temporary runtime for this execution
    const mcpServer: MCPServer = {
      serverId: runtimeId,
      name: `Execution Runtime ${executionId}`,
      description: "Temporary runtime for workflow execution",
      tools: steps.map((step) => ({
        toolId: step.type,
        name: step.data.label || step.type,
        description: `${step.type} operation`,
        inputSchema: {
          type: "object",
          properties: {},
        },
      })),
      resources: [],
      agents: [],
      permissions: [],
      status: "created",
      createdAt: new Date(),
    };

    runtimeManager.createRuntime(mcpServer);
    runtime = runtimeManager.getRuntime(runtimeId)!;
  }

  // Start runtime
  runtimeManager.startRuntime(runtimeId);

  const vars: Record<string, any> = {
    input: { ...input },
  };

  const startedAt = Date.now();

  // Emit workflow start event
  socketServer.emitExecutionLog(executionId, {
    type: "workflow_start",
    timestamp: new Date().toISOString(),
    data: {
      message: "MCP workflow execution started",
      stepCount: steps.length,
      runtimeId,
    },
  });

  // Build execution order from edges
  const executionOrder = buildExecutionOrder(steps, edges);

  logger.info("Execution order determined", {
    executionId,
    order: executionOrder.map((s) => s.id),
  });

  // Execute tools in order
  for (let index = 0; index < executionOrder.length; index++) {
    const step = executionOrder[index];
    const stepStart = Date.now();
    const stepName = step.data.label || `${step.type}_${index}`;

    // Emit step_start event
    socketServer.emitExecutionLog(executionId, {
      type: "step_start",
      stepIndex: index,
      stepType: step.type,
      stepName,
      timestamp: new Date().toISOString(),
    });

    logger.debug("Step started", {
      executionId,
      stepIndex: index,
      stepType: step.type,
      stepName,
    });

    try {
      // Prepare tool input from step fields
      const toolInput = {
        ...(step.data.fields || {}),
      };

      // Create runtime context
      const context = {
        vars,
        headers,
        executionId,
        socketServer,
      };

      // Invoke tool via runtime manager
      const output = await runtimeManager.invokeTool(
        runtimeId,
        step.type,
        toolInput,
        context
      );

      const durationMs = Date.now() - stepStart;

      // Emit step_complete event
      socketServer.emitExecutionLog(executionId, {
        type: "step_complete",
        stepIndex: index,
        stepType: step.type,
        stepName,
        timestamp: new Date().toISOString(),
        durationMs,
        output,
      });

      logger.debug("Step completed", {
        executionId,
        stepIndex: index,
        stepType: step.type,
        durationMs,
      });
    } catch (err: any) {
      const durationMs = Date.now() - stepStart;

      logger.error("Step failed", {
        executionId,
        stepIndex: index,
        stepType: step.type,
        stepName,
        error: err.message,
      });

      // Emit step_error event
      socketServer.emitExecutionLog(executionId, {
        type: "step_error",
        stepIndex: index,
        stepType: step.type,
        stepName,
        timestamp: new Date().toISOString(),
        error: err.message || "Unknown error occurred",
        durationMs,
      });

      // Stop runtime on error
      runtimeManager.stopRuntime(runtimeId);

      return {
        ok: false,
        failedStep: index,
        failedStepName: stepName,
        error: err.message || "Unknown error occurred",
        errorDetails: err.details || null,
        totalDurationMs: Date.now() - startedAt,
      };
    }
  }

  const totalDurationMs = Date.now() - startedAt;

  logger.info("MCP Workflow engine completed", {
    executionId,
    stepsExecuted: executionOrder.length,
    totalDurationMs,
  });

  // Emit workflow_complete event
  socketServer.emitExecutionLog(executionId, {
    type: "workflow_complete",
    timestamp: new Date().toISOString(),
    data: {
      stepsExecuted: executionOrder.length,
      totalDurationMs,
    },
  });

  // Stop runtime
  runtimeManager.stopRuntime(runtimeId);

  // If there's a response, return it
  if (vars._response) {
    return vars._response.body;
  }

  return {
    ok: true,
    stepsExecuted: executionOrder.length,
    output: vars,
    totalDurationMs,
  };
}

/**
 * Build execution order from nodes and edges
 * Simple topological sort
 */
function buildExecutionOrder(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): WorkflowNode[] {
  // Build adjacency map
  const adj = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  nodes.forEach((n) => {
    adj.set(n.id, []);
    inDegree.set(n.id, 0);
  });

  edges.forEach((e) => {
    if (adj.has(e.source)) {
      adj.get(e.source)!.push(e.target);
    }
    if (inDegree.has(e.target)) {
      inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
    }
  });

  // Find nodes with no incoming edges
  const queue: string[] = [];
  inDegree.forEach((degree, nodeId) => {
    if (degree === 0) {
      queue.push(nodeId);
    }
  });

  // Topological sort
  const order: string[] = [];
  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    order.push(nodeId);

    const neighbors = adj.get(nodeId) || [];
    for (const neighbor of neighbors) {
      const newDegree = (inDegree.get(neighbor) || 0) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) {
        queue.push(neighbor);
      }
    }
  }

  // If not all nodes are in order, there's a cycle or disconnected nodes
  if (order.length < nodes.length) {
    logger.warn("Workflow has cycles or disconnected nodes, using original order");
    return nodes;
  }

  // Map order back to nodes
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  return order.map((id) => nodeMap.get(id)!).filter(Boolean);
}
