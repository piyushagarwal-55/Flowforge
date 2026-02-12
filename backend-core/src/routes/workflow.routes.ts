import { Router, Request, Response, NextFunction } from 'express';
import Workflow from '../models/workflow.model';
import PublishedApi from '../models/publishedApi.model';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Helper function to convert API name to URL-safe slug
 */
function toApiSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * GET /workflows/:workflowId
 * Get workflow by ID
 */
router.get('/:workflowId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { workflowId } = req.params;
    const { ownerId = 'user_default' } = req.query;

    logger.info('[getWorkflow] 📥 Fetching workflow', {
      workflowId,
      ownerId,
      url: req.url,
    });

    if (!workflowId || workflowId === 'undefined' || workflowId === 'null') {
      logger.error('[getWorkflow] ❌ Invalid workflowId', {
        workflowId,
        url: req.url,
      });

      res.status(400).json({
        error: 'workflowId is required and must be valid',
      });
      return;
    }

    const workflow = await Workflow.findOne({ workflowId, ownerId });

    if (!workflow) {
      logger.warn('[getWorkflow] ⚠️ Workflow not found', {
        workflowId,
        ownerId,
      });

      res.status(404).json({
        error: 'Workflow not found',
      });
      return;
    }

    logger.info('[getWorkflow] ✅ Workflow found', {
      workflowId,
      nodeCount: workflow.steps?.length || 0,
      apiName: workflow.apiName,
    });

    res.status(200).json({
      workflowId: workflow.workflowId,
      apiName: workflow.apiName,
      apiPath: workflow.apiPath,
      ownerId: workflow.ownerId,
      steps: workflow.steps,
      edges: workflow.edges,
      inputVariables: workflow.inputVariables,
      createdAt: workflow.createdAt,
      updatedAt: workflow.updatedAt,
    });
  } catch (error) {
    logger.error('[getWorkflow] ❌ Error fetching workflow', {
      workflowId: req.params.workflowId,
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    next(error);
  }
});

/**
 * POST /workflows
 * Create new workflow
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { workflowId, ownerId, steps, edges, apiName, inputVariables } = req.body;

    if (!workflowId || !ownerId || !Array.isArray(steps) || !apiName) {
      res.status(400).json({
        error: 'workflowId, ownerId, steps, apiName required',
      });
      return;
    }

    // Validate steps format
    for (const step of steps) {
      if (!step.type) {
        res.status(400).json({
          error: 'Invalid workflow step format',
        });
        return;
      }
    }

    // Save workflow
    const workflow = await Workflow.findOneAndUpdate(
      { workflowId, ownerId },
      {
        workflowId,
        ownerId,
        apiName,
        apiPath: `/workflow/run/${workflowId}/${toApiSlug(apiName)}`,
        steps,
        edges: edges || [],
        inputVariables: inputVariables || [],
      },
      { upsert: true, new: true }
    );

    // Publish API
    const slug = toApiSlug(apiName);
    const path = `/workflow/run/${workflowId}/${slug}`;

    await PublishedApi.findOneAndUpdate(
      { path, ownerId },
      {
        workflowId,
        ownerId,
        name: apiName,
        slug,
        method: 'POST',
        inputVariables: inputVariables || [],
      },
      { upsert: true, new: true }
    );

    logger.info('✅ Workflow saved & API published', {
      path,
      inputVariables,
    });

    res.status(200).json({
      ok: true,
      workflowId,
      apiPath: path,
      apiName,
      inputVariables: inputVariables || [],
    });
  } catch (error) {
    logger.error('[saveWorkflow] ❌ Error saving workflow', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    next(error);
  }
});

/**
 * PUT /workflows/:workflowId
 * Update existing workflow
 */
router.put('/:workflowId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { workflowId } = req.params;
    const { ownerId, steps, edges, apiName, inputVariables } = req.body;

    if (!ownerId || !Array.isArray(steps) || !apiName) {
      res.status(400).json({
        error: 'ownerId, steps, apiName required',
      });
      return;
    }

    // Validate steps format
    for (const step of steps) {
      if (!step.type) {
        res.status(400).json({
          error: 'Invalid workflow step format',
        });
        return;
      }
    }

    // Update workflow
    const workflow = await Workflow.findOneAndUpdate(
      { workflowId, ownerId },
      {
        apiName,
        apiPath: `/workflow/run/${workflowId}/${toApiSlug(apiName)}`,
        steps,
        edges: edges || [],
        inputVariables: inputVariables || [],
      },
      { new: true }
    );

    if (!workflow) {
      res.status(404).json({
        error: 'Workflow not found',
      });
      return;
    }

    // Update published API
    const slug = toApiSlug(apiName);
    const path = `/workflow/run/${workflowId}/${slug}`;

    await PublishedApi.findOneAndUpdate(
      { workflowId, ownerId },
      {
        name: apiName,
        slug,
        path,
        method: 'POST',
        inputVariables: inputVariables || [],
      },
      { upsert: true }
    );

    logger.info('✅ Workflow updated', {
      workflowId,
      path,
    });

    res.status(200).json({
      ok: true,
      workflowId,
      apiPath: path,
      apiName,
      inputVariables: inputVariables || [],
    });
  } catch (error) {
    logger.error('[updateWorkflow] ❌ Error updating workflow', {
      workflowId: req.params.workflowId,
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    next(error);
  }
});

/**
 * DELETE /workflows/:workflowId
 * Delete workflow
 */
router.delete('/:workflowId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { workflowId } = req.params;
    const { ownerId } = req.query;

    if (!ownerId) {
      res.status(400).json({
        error: 'ownerId is required',
      });
      return;
    }

    const workflow = await Workflow.findOneAndDelete({ workflowId, ownerId });

    if (!workflow) {
      res.status(404).json({
        error: 'Workflow not found',
      });
      return;
    }

    // Delete published API
    await PublishedApi.deleteMany({ workflowId, ownerId });

    logger.info('✅ Workflow deleted', {
      workflowId,
      ownerId,
    });

    res.status(200).json({
      ok: true,
      message: 'Workflow deleted successfully',
    });
  } catch (error) {
    logger.error('[deleteWorkflow] ❌ Error deleting workflow', {
      workflowId: req.params.workflowId,
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    next(error);
  }
});

/**
 * GET /workflows
 * List user's workflows
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ownerId = 'user_default' } = req.query;

    logger.info('[listWorkflows] 📥 Fetching workflows', {
      ownerId,
    });

    const workflows = await Workflow.find({ ownerId })
      .select('workflowId apiName apiPath steps edges inputVariables createdAt updatedAt')
      .sort({ updatedAt: -1 });

    logger.info('[listWorkflows] ✅ Workflows found', {
      count: workflows.length,
      ownerId,
    });

    res.status(200).json({
      workflows: workflows.map(w => ({
        workflowId: w.workflowId,
        apiName: w.apiName,
        apiPath: w.apiPath,
        nodeCount: w.steps?.length || 0,
        inputVariables: w.inputVariables,
        createdAt: w.createdAt,
        updatedAt: w.updatedAt,
      })),
    });
  } catch (error) {
    logger.error('[listWorkflows] ❌ Error fetching workflows', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    next(error);
  }
});

export default router;
