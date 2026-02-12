import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import Workflow from '../models/workflow.model';
import PublishedApi from '../models/publishedApi.model';
import { runEngine } from '../services/workflowEngine';
import { runMCPEngine } from '../services/mcpWorkflowEngine';
import { logger } from '../utils/logger';
import { SocketServer } from '../socket';

const router = Router();

// Feature flag to enable MCP engine (set to true to use MCP infrastructure)
const USE_MCP_ENGINE = process.env.USE_MCP_ENGINE === 'true' || false;

// Store socketServer reference (will be set when routes are registered)
let socketServer: SocketServer;

/**
 * Initialize execution routes with socket server
 */
export function initExecutionRoutes(socket: SocketServer): Router {
  socketServer = socket;
  return router;
}

/**
 * POST /workflows/:workflowId/execute
 * Execute workflow by ID
 */
router.post('/:workflowId/execute', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { workflowId } = req.params;
    const { input = {}, ownerId = 'user_default' } = req.body;

    logger.info('[executeWorkflow] 📥 Execute request received', {
      workflowId,
      ownerId,
    });

    // Load workflow
    const workflow = await Workflow.findOne({ workflowId, ownerId });

    if (!workflow) {
      res.status(404).json({
        error: 'Workflow not found',
      });
      return;
    }

    if (!Array.isArray(workflow.steps) || workflow.steps.length === 0) {
      res.status(400).json({
        error: 'Workflow has no steps',
      });
      return;
    }

    // Generate execution ID
    const executionId = uuidv4();

    logger.info('[executeWorkflow] 🚀 Starting workflow execution', {
      workflowId,
      executionId,
      stepCount: workflow.steps.length,
    });

    // Execute workflow asynchronously with a small delay to allow client to connect
    setImmediate(async () => {
      try {
        // Give client 500ms to establish Socket.io connection and join room
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Choose engine based on feature flag
        const result = USE_MCP_ENGINE
          ? await runMCPEngine(
              workflow.steps,
              workflow.edges || [],
              input,
              req.headers,
              executionId,
              socketServer
            )
          : await runEngine(
              workflow.steps,
              input,
              req.headers,
              executionId,
              socketServer
            );

        logger.info('[executeWorkflow] ✅ Workflow execution completed', {
          workflowId,
          executionId,
          ok: result.ok,
          stepsExecuted: result.stepsExecuted,
          engine: USE_MCP_ENGINE ? 'MCP' : 'Legacy',
        });
      } catch (error) {
        logger.error('[executeWorkflow] ❌ Workflow execution failed', {
          workflowId,
          executionId,
          error: (error as Error).message,
          stack: (error as Error).stack,
        });
      }
    });

    // Return immediately with execution ID
    res.status(200).json({
      ok: true,
      executionId,
      message: 'Workflow execution started',
    });
  } catch (error) {
    logger.error('[executeWorkflow] ❌ Error starting execution', {
      workflowId: req.params.workflowId,
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    next(error);
  }
});

/**
 * POST /workflows/run
 * Run workflow with inline definition (no database lookup)
 */
router.post('/run', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { steps, input = {} } = req.body;

    if (!Array.isArray(steps) || steps.length === 0) {
      res.status(400).json({
        error: 'steps[] required and must not be empty',
      });
      return;
    }

    // Generate execution ID
    const executionId = uuidv4();

    logger.info('[runWorkflow] 🚀 Starting inline workflow execution', {
      executionId,
      stepCount: steps.length,
    });

    // Execute workflow asynchronously with a small delay to allow client to connect
    setImmediate(async () => {
      try {
        // Give client 500ms to establish Socket.io connection and join room
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Choose engine based on feature flag
        const result = USE_MCP_ENGINE
          ? await runMCPEngine(
              steps,
              [], // No edges for inline execution
              input,
              req.headers,
              executionId,
              socketServer
            )
          : await runEngine(
              steps,
              input,
              req.headers,
              executionId,
              socketServer
            );

        logger.info('[runWorkflow] ✅ Inline workflow execution completed', {
          executionId,
          ok: result.ok,
          stepsExecuted: result.stepsExecuted,
          engine: USE_MCP_ENGINE ? 'MCP' : 'Legacy',
        });
      } catch (error) {
        logger.error('[runWorkflow] ❌ Inline workflow execution failed', {
          executionId,
          error: (error as Error).message,
          stack: (error as Error).stack,
        });
      }
    });

    // Return immediately with execution ID
    res.status(200).json({
      ok: true,
      executionId,
      message: 'Workflow execution started',
    });
  } catch (error) {
    logger.error('[runWorkflow] ❌ Error starting inline execution', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    next(error);
  }
});

/**
 * POST /workflow/run/:workflowId/:apiName
 * Run published workflow API
 */
router.post('/workflow/run/:workflowId/:apiName', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { workflowId, apiName } = req.params;
    const input = req.body || {};

    logger.info('[runPublishedWorkflow] 📥 Published API called', {
      workflowId,
      apiName,
    });

    if (!workflowId || !apiName) {
      res.status(400).json({
        error: 'Invalid workflow path',
      });
      return;
    }

    // Ensure API is published
    const api = await PublishedApi.findOne({
      workflowId,
      slug: apiName,
    });

    if (!api) {
      res.status(404).json({
        error: 'API not published',
      });
      return;
    }

    // Load workflow
    const workflow = await Workflow.findOne({ workflowId });
    if (!workflow) {
      res.status(404).json({
        error: 'Workflow not found',
      });
      return;
    }

    logger.info('[runPublishedWorkflow] 🚀 Running published workflow', {
      workflowId,
      api: api.name,
      input,
    });

    // Generate execution ID
    const executionId = uuidv4();

    // Execute workflow synchronously for published APIs (return result)
    // Choose engine based on feature flag
    const result = USE_MCP_ENGINE
      ? await runMCPEngine(
          workflow.steps,
          workflow.edges || [],
          input,
          req.headers,
          executionId,
          socketServer
        )
      : await runEngine(
          workflow.steps,
          input,
          req.headers,
          executionId,
          socketServer
        );

    logger.info('[runPublishedWorkflow] ✅ Published workflow completed', {
      workflowId,
      executionId,
      ok: result.ok,
      engine: USE_MCP_ENGINE ? 'MCP' : 'Legacy',
    });

    res.status(200).json(result);
  } catch (error) {
    logger.error('[runPublishedWorkflow] ❌ Error running published workflow', {
      workflowId: req.params.workflowId,
      apiName: req.params.apiName,
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    next(error);
  }
});

export default router;
