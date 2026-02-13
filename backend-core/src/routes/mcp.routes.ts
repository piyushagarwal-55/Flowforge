/**
 * MCP Control Routes
 * REST API for MCP server management, runtime control, and topology
 */

import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import MCPServer from '../models/mcpServer.model';
import { runtimeManager } from '../mcp/runtime.manager';
import { logger } from '../utils/logger';
import { eventRingBuffer } from '../services/eventRingBuffer';
import { SocketServer } from '../socket';

export function initMCPRoutes(socketServer: SocketServer) {
  const router = Router();

/**
 * GET /mcp/servers
 * List all MCP servers for user
 */
router.get('/servers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ownerId } = req.query;

    if (!ownerId) {
      res.status(400).json({ error: 'ownerId required' });
      return;
    }

    const servers = await MCPServer.find({ ownerId }).sort({ createdAt: -1 });

    logger.info('[mcpServers] Servers listed', {
      ownerId,
      count: servers.length,
    });

    res.status(200).json({
      servers: servers.map((s) => {
        // Get runtime status
        const runtime = runtimeManager.getRuntime(s.serverId);
        const runtimeStatus = runtime?.status || 'not_loaded';
        
        return {
          serverId: s.serverId,
          name: s.name,
          description: s.description,
          toolCount: s.tools.length,
          resourceCount: s.resources.length,
          agentCount: s.agents.length,
          status: s.status,
          runtimeStatus,
          createdAt: s.createdAt,
        };
      }),
    });
  } catch (error) {
    logger.error('[mcpServers] Error listing servers', {
      error: (error as Error).message,
    });
    next(error);
  }
});

/**
 * GET /mcp/servers/:serverId
 * Get MCP server details
 */
router.get('/servers/:serverId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { serverId } = req.params;
    const { ownerId } = req.query;

    if (!ownerId) {
      res.status(400).json({ error: 'ownerId required' });
      return;
    }

    const server = await MCPServer.findOne({ serverId, ownerId });

    if (!server) {
      res.status(404).json({ error: 'Server not found' });
      return;
    }

    // Get runtime status
    const runtime = runtimeManager.getRuntime(serverId);
    const runtimeStatus = runtime?.status || 'not_loaded';

    logger.info('[mcpServer] Server retrieved', {
      serverId,
      ownerId,
      runtimeStatus,
    });

    res.status(200).json({
      serverId: server.serverId,
      name: server.name,
      description: server.description,
      tools: server.tools,
      resources: server.resources,
      agents: server.agents,
      permissions: server.permissions,
      executionOrder: server.executionOrder,
      status: server.status,
      runtimeStatus,
      createdAt: server.createdAt,
      updatedAt: server.updatedAt,
    });
  } catch (error) {
    logger.error('[mcpServer] Error retrieving server', {
      error: (error as Error).message,
    });
    next(error);
  }
});

/**
 * PATCH /mcp/servers/:serverId
 * Update MCP server (tools, executionOrder, etc.)
 */
router.patch('/servers/:serverId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { serverId } = req.params;
    const { ownerId, tools, executionOrder, name, description } = req.body;

    if (!ownerId) {
      res.status(400).json({ error: 'ownerId required' });
      return;
    }

    const server = await MCPServer.findOne({ serverId, ownerId });

    if (!server) {
      res.status(404).json({ error: 'Server not found' });
      return;
    }

    // Update fields if provided
    if (tools !== undefined) server.tools = tools;
    if (executionOrder !== undefined) server.executionOrder = executionOrder;
    if (name !== undefined) server.name = name;
    if (description !== undefined) server.description = description;

    await server.save();

    // Update runtime if it exists
    const runtime = runtimeManager.getRuntime(serverId);
    if (runtime) {
      const wasRunning = runtime.status === 'running';
      
      // Recreate runtime with updated server definition
      runtimeManager.createRuntime({
        serverId: server.serverId,
        name: server.name,
        description: server.description,
        tools: server.tools,
        resources: server.resources,
        agents: server.agents,
        permissions: server.permissions,
        executionOrder: server.executionOrder,
        status: server.status,
        ownerId: server.ownerId,
        createdAt: server.createdAt,
      });
      
      // If runtime was running before, start it again
      if (wasRunning) {
        runtimeManager.startRuntime(serverId);
        logger.info('[mcpServer] Runtime restarted after update', {
          serverId,
        });
      }
    }

    logger.info('[mcpServer] Server updated', {
      serverId,
      ownerId,
      toolsCount: server.tools.length,
      executionOrderLength: server.executionOrder?.length || 0,
    });

    res.status(200).json({
      serverId: server.serverId,
      name: server.name,
      description: server.description,
      tools: server.tools,
      executionOrder: server.executionOrder,
      updatedAt: server.updatedAt,
    });
  } catch (error) {
    logger.error('[mcpServer] Error updating server', {
      error: (error as Error).message,
    });
    next(error);
  }
});

/**
 * GET /mcp/servers/:serverId/tools
 * Get tool schemas for dynamic form generation
 */
router.get('/servers/:serverId/tools', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { serverId } = req.params;
    const { ownerId } = req.query;

    if (!ownerId) {
      res.status(400).json({ error: 'ownerId required' });
      return;
    }

    const server = await MCPServer.findOne({ serverId, ownerId });

    if (!server) {
      res.status(404).json({ error: 'Server not found' });
      return;
    }

    // Log for debugging
    logger.info('[mcpTools] Server tools check', {
      serverId,
      toolsCount: server.tools.length,
      hasExecutionOrder: !!server.executionOrder,
      executionOrderLength: server.executionOrder?.length || 0,
    });

    // Return tools with schemas (without handlers)
    const tools = server.tools.map((tool: any) => ({
      toolId: tool.toolId,
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
      outputSchema: tool.outputSchema,
    }));

    logger.info('[mcpTools] Tools retrieved', {
      serverId,
      ownerId,
      toolCount: tools.length,
    });

    res.status(200).json({
      serverId,
      tools,
      executionOrder: server.executionOrder || [],
    });
  } catch (error) {
    logger.error('[mcpTools] Error retrieving tools', {
      error: (error as Error).message,
    });
    next(error);
  }
});

/**
 * POST /mcp/servers/:serverId/runtime/start
 * Start MCP runtime
 */
router.post('/servers/:serverId/runtime/start', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { serverId } = req.params;
    const { ownerId } = req.body;

    if (!ownerId) {
      res.status(400).json({ error: 'ownerId required' });
      return;
    }

    // Verify server exists
    const server = await MCPServer.findOne({ serverId, ownerId });

    if (!server) {
      res.status(404).json({ error: 'Server not found' });
      return;
    }

    // Check if runtime exists
    let runtime = runtimeManager.getRuntime(serverId);

    if (!runtime) {
      // Create runtime if it doesn't exist
      runtimeManager.createRuntime({
        serverId: server.serverId,
        name: server.name,
        description: server.description,
        tools: server.tools,
        resources: server.resources,
        agents: server.agents,
        permissions: server.permissions,
        status: 'created',
        ownerId: server.ownerId,
        createdAt: server.createdAt,
        updatedAt: server.updatedAt,
      });
    }

    // Start runtime
    const started = runtimeManager.startRuntime(serverId);

    if (!started) {
      res.status(500).json({ error: 'Failed to start runtime' });
      return;
    }

    // Update server status
    server.status = 'running';
    await server.save();

    logger.info('[mcpRuntime] Runtime started', {
      serverId,
      ownerId,
    });

    res.status(200).json({
      serverId,
      status: 'running',
      message: 'Runtime started successfully',
    });
  } catch (error) {
    logger.error('[mcpRuntime] Error starting runtime', {
      error: (error as Error).message,
    });
    next(error);
  }
});

/**
 * POST /mcp/servers/:serverId/runtime/stop
 * Stop MCP runtime
 */
router.post('/servers/:serverId/runtime/stop', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { serverId } = req.params;
    const { ownerId } = req.body;

    if (!ownerId) {
      res.status(400).json({ error: 'ownerId required' });
      return;
    }

    // Verify server exists
    const server = await MCPServer.findOne({ serverId, ownerId });

    if (!server) {
      res.status(404).json({ error: 'Server not found' });
      return;
    }

    // Stop runtime
    const stopped = runtimeManager.stopRuntime(serverId);

    if (!stopped) {
      res.status(500).json({ error: 'Failed to stop runtime' });
      return;
    }

    // Update server status
    server.status = 'stopped';
    await server.save();

    logger.info('[mcpRuntime] Runtime stopped', {
      serverId,
      ownerId,
    });

    res.status(200).json({
      serverId,
      status: 'stopped',
      message: 'Runtime stopped successfully',
    });
  } catch (error) {
    logger.error('[mcpRuntime] Error stopping runtime', {
      error: (error as Error).message,
    });
    next(error);
  }
});

/**
 * POST /mcp/servers/:serverId/invoke
 * Invoke MCP tool
 */
router.post('/servers/:serverId/invoke', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { serverId } = req.params;
    const { agentId, toolId, input, ownerId } = req.body;

    if (!ownerId) {
      res.status(400).json({ error: 'ownerId required' });
      return;
    }

    if (!toolId || !input) {
      res.status(400).json({ error: 'toolId and input required' });
      return;
    }

    // Verify server exists
    const server = await MCPServer.findOne({ serverId, ownerId });

    if (!server) {
      res.status(404).json({ error: 'Server not found' });
      return;
    }

    // Get runtime
    const runtime = runtimeManager.getRuntime(serverId);

    if (!runtime || runtime.status !== 'running') {
      res.status(400).json({ error: 'Runtime not running' });
      return;
    }

    // Create invocation ID
    const invocationId = uuidv4();
    const executionId = `invoke-${Date.now()}`;

    // Create context with real socket server
    const context = {
      vars: {},
      headers: {},
      executionId,
      socketServer,
    };

    // Invoke tool
    const startTime = Date.now();
    const result = await runtimeManager.invokeTool(
      serverId,
      toolId,
      input,
      context,
      agentId
    );
    const duration = Date.now() - startTime;

    logger.info('[mcpInvoke] Tool invoked', {
      serverId,
      toolId,
      agentId,
      ownerId,
      invocationId,
      duration,
    });

    res.status(200).json({
      success: true,
      serverId,
      toolId,
      agentId,
      output: result,
      invocationId,
      duration,
      invokedAt: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('[mcpInvoke] Error invoking tool', {
      error: (error as Error).message,
    });

    // Check if it's a permission error
    if ((error as any).name === 'PermissionDeniedError') {
      res.status(403).json({
        success: false,
        error: 'Permission denied',
        message: (error as Error).message,
      });
      return;
    }

    next(error);
  }
});

/**
 * POST /mcp/servers/:serverId/run-agent
 * Execute full agent chain (one-click execution)
 */
router.post('/servers/:serverId/run-agent', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { serverId } = req.params;
    const { agentId, input, ownerId } = req.body;

    if (!ownerId) {
      res.status(400).json({ error: 'ownerId required' });
      return;
    }

    if (!input) {
      res.status(400).json({ error: 'input required' });
      return;
    }

    // Verify server exists
    const server = await MCPServer.findOne({ serverId, ownerId });

    if (!server) {
      res.status(404).json({ error: 'Server not found' });
      return;
    }

    // Get runtime
    const runtime = runtimeManager.getRuntime(serverId);

    if (!runtime || runtime.status !== 'running') {
      res.status(400).json({ error: 'Runtime not running' });
      return;
    }

    // Get execution order
    const executionOrder = server.executionOrder || server.tools.map((t: any) => t.toolId);

    if (executionOrder.length === 0) {
      logger.error('[runAgent] No tools to execute', {
        serverId,
        hasExecutionOrder: !!server.executionOrder,
        toolsCount: server.tools.length,
        tools: server.tools.map((t: any) => ({ toolId: t.toolId, name: t.name })),
      });
      res.status(400).json({ 
        error: 'No tools to execute',
        details: {
          toolsCount: server.tools.length,
          hasExecutionOrder: !!server.executionOrder,
        }
      });
      return;
    }

    const executionId = `agent-run-${Date.now()}`;
    const startTime = Date.now();
    const results: any[] = [];

    // Create context with real socket server
    // Wrap input data to match what input tool expects: context.vars.input.input
    const context = {
      vars: { input: { input } },
      headers: {},
      executionId,
      socketServer,
    };

    logger.info('[runAgent] Context created', {
      executionId,
      hasVars: !!context.vars,
      hasInput: !!context.vars.input,
      hasInputInput: !!context.vars.input?.input,
      inputKeys: context.vars.input?.input ? Object.keys(context.vars.input.input) : [],
    });

    // Execute tools in order
    for (let i = 0; i < executionOrder.length; i++) {
      const toolId = executionOrder[i];
      const tool = server.tools.find((t: any) => t.toolId === toolId);

      if (!tool) {
        logger.warn('[runAgent] Tool not found in server', { toolId, serverId });
        continue;
      }

      try {
        // Emit step start event
        socketServer.emitToRoom(executionId, 'agent:step:start', {
          executionId,
          step: i + 1,
          totalSteps: executionOrder.length,
          toolId,
          toolName: tool.name,
          status: 'running',
        });

        const stepStartTime = Date.now();
        
        // Use the tool's stored inputSchema directly (it has the actual data)
        const toolInput = tool.inputSchema || {};
        
        logger.info('[runAgent] Invoking tool', {
          serverId,
          toolId,
          toolName: tool.name,
          toolInput: JSON.stringify(toolInput).slice(0, 200),
          contextVars: Object.keys(context.vars),
        });
        
        const result = await runtimeManager.invokeTool(
          serverId,
          toolId,
          toolInput,
          context,
          agentId
        );
        const stepDuration = Date.now() - stepStartTime;

        results.push({
          step: i + 1,
          toolId,
          toolName: tool.name,
          status: 'success',
          output: result,
          duration: stepDuration,
        });

        // Emit step success event
        socketServer.emitToRoom(executionId, 'agent:step:complete', {
          executionId,
          step: i + 1,
          totalSteps: executionOrder.length,
          toolId,
          toolName: tool.name,
          status: 'success',
          output: result,
          duration: stepDuration,
        });

      } catch (error) {
        const errorMessage = (error as Error).message;
        
        results.push({
          step: i + 1,
          toolId,
          toolName: tool.name,
          status: 'failed',
          error: errorMessage,
        });

        // Emit step failure event
        socketServer.emitToRoom(executionId, 'agent:step:complete', {
          executionId,
          step: i + 1,
          totalSteps: executionOrder.length,
          toolId,
          toolName: tool.name,
          status: 'failed',
          error: errorMessage,
        });

        // Abort on error
        logger.error('[runAgent] Tool execution failed, aborting chain', {
          serverId,
          toolId,
          error: errorMessage,
        });
        break;
      }
    }

    const totalDuration = Date.now() - startTime;
    const successCount = results.filter(r => r.status === 'success').length;
    const failedCount = results.filter(r => r.status === 'failed').length;

    logger.info('[runAgent] Agent execution completed', {
      serverId,
      agentId,
      executionId,
      totalSteps: executionOrder.length,
      successCount,
      failedCount,
      duration: totalDuration,
    });

    res.status(200).json({
      success: failedCount === 0,
      serverId,
      agentId,
      executionId,
      results,
      summary: {
        totalSteps: executionOrder.length,
        successCount,
        failedCount,
        duration: totalDuration,
      },
      executedAt: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('[runAgent] Error running agent', {
      error: (error as Error).message,
    });
    next(error);
  }
});

/**
 * GET /mcp/events
 * Get recent MCP events from ring buffer
 */
router.get('/events', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit, type, serverId, agentId } = req.query;
    const limitNum = limit ? parseInt(limit as string, 10) : 100;

    let events;

    if (type) {
      events = eventRingBuffer.getByType(type as string, limitNum);
    } else if (serverId) {
      events = eventRingBuffer.getByServer(serverId as string, limitNum);
    } else if (agentId) {
      events = eventRingBuffer.getByAgent(agentId as string, limitNum);
    } else {
      events = eventRingBuffer.getRecent(limitNum);
    }

    logger.info('[mcpEvents] Events retrieved', {
      count: events.length,
      limit: limitNum,
      type,
      serverId,
      agentId,
    });

    res.status(200).json({
      events,
      count: events.length,
      bufferSize: eventRingBuffer.size(),
    });
  } catch (error) {
    logger.error('[mcpEvents] Error retrieving events', {
      error: (error as Error).message,
    });
    next(error);
  }
});

/**
 * POST /api/:serverId
 * Public HTTP API endpoint for MCP servers (Tambo-style publishing)
 * Auto-starts runtime if not running
 */
router.post('/api/:serverId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { serverId } = req.params;
    const input = req.body;

    logger.info('[mcpApi] API call received', {
      serverId,
      input,
    });

    // Verify server exists
    const server = await MCPServer.findOne({ serverId });

    if (!server) {
      res.status(404).json({ error: 'MCP server not found' });
      return;
    }

    // Check if runtime exists
    let runtime = runtimeManager.getRuntime(serverId);

    // Auto-start runtime if not running
    if (!runtime) {
      logger.info('[mcpApi] Creating runtime for first API call', { serverId });
      runtimeManager.createRuntime({
        serverId: server.serverId,
        name: server.name,
        description: server.description,
        tools: server.tools,
        resources: server.resources,
        agents: server.agents,
        permissions: server.permissions,
        status: 'created',
        ownerId: server.ownerId,
        createdAt: server.createdAt,
        updatedAt: server.updatedAt,
      });
      runtime = runtimeManager.getRuntime(serverId);
    }

    if (runtime?.status !== 'running') {
      logger.info('[mcpApi] Starting runtime for API call', { serverId });
      runtimeManager.startRuntime(serverId);
      server.status = 'running';
      await server.save();
    }

    // Get execution order
    const executionOrder = server.executionOrder || server.tools.map((t: any) => t.toolId);

    if (executionOrder.length === 0) {
      res.status(400).json({ error: 'No tools configured in MCP server' });
      return;
    }

    const executionId = `api-${Date.now()}`;
    const startTime = Date.now();
    const results: any[] = [];

    // Create context with properly initialized vars
    const context = {
      vars: { 
        input: input  // Direct input, not nested
      },
      headers: req.headers,
      executionId,
      socketServer,
    };

    // Execute tools in order
    for (let i = 0; i < executionOrder.length; i++) {
      const toolId = executionOrder[i];
      const tool = server.tools.find((t: any) => t.toolId === toolId);

      if (!tool) {
        logger.warn('[mcpApi] Tool not found', { toolId, serverId });
        continue;
      }

      try {
        const stepStartTime = Date.now();
        
        // Use the tool's stored inputSchema directly (it has the actual data)
        const toolInput = tool.inputSchema || {};
        
        logger.info('[mcpApi] Invoking tool', {
          serverId,
          toolId,
          toolName: tool.name,
          toolInput: JSON.stringify(toolInput).slice(0, 200),
          contextVars: Object.keys(context.vars),
        });
        
        const result = await runtimeManager.invokeTool(
          serverId,
          toolId,
          toolInput,
          context
        );
        const stepDuration = Date.now() - stepStartTime;

        results.push({
          step: i + 1,
          toolId,
          toolName: tool.name,
          status: 'success',
          output: result,
          duration: stepDuration,
        });

      } catch (error) {
        const errorMessage = (error as Error).message;
        
        results.push({
          step: i + 1,
          toolId,
          toolName: tool.name,
          status: 'failed',
          error: errorMessage,
        });

        logger.error('[mcpApi] Tool execution failed', {
          serverId,
          toolId,
          error: errorMessage,
        });

        // Return error response
        res.status(500).json({
          success: false,
          error: errorMessage,
          serverId,
          executionId,
          results,
        });
        return;
      }
    }

    const totalDuration = Date.now() - startTime;

    // Extract final result from last successful step
    const lastResult = results[results.length - 1];
    const finalOutput = lastResult?.output || { success: true };

    logger.info('[mcpApi] API execution completed', {
      serverId,
      executionId,
      duration: totalDuration,
      stepsExecuted: results.length,
    });

    // Return final result directly (like Tambo)
    res.status(200).json(finalOutput);
  } catch (error) {
    logger.error('[mcpApi] Error executing API', {
      error: (error as Error).message,
    });
    next(error);
  }
});

  return router;
}
