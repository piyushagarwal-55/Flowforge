import { ApiRouteConfig, StepHandler } from "motia";
import { connectMongo } from "../lib/mongo";
import Workflow from "../models/workflow.model";

export const config: ApiRouteConfig = {
  name: "getWorkflow",
  type: "api",
  path: "/workflows/:workflowId",
  method: "GET",
  emits: [],
};

export const handler: StepHandler<typeof config> = async (req, ctx) => {
  // ✅ Fix: Extract workflowId from URL path
  const pathParts = req.url?.split('/') || [];
  const workflowIdRaw = pathParts[pathParts.indexOf('workflows') + 1];
  const workflowId = workflowIdRaw?.split('?')[0];
  const { ownerId = "user_default" } = req.query || {};

  ctx.logger.info(`[getWorkflow] 📥 Fetching workflow`, {
    workflowId,
    workflowIdRaw,
    ownerId,
    url: req.url,
    pathParts,
  });

  if (!workflowId || workflowId === 'undefined' || workflowId === 'null') {
    ctx.logger.error(`[getWorkflow] ❌ Invalid workflowId`, {
      workflowId,
      workflowIdRaw,
      url: req.url,
    });
    
    return {
      status: 400,
      body: { error: "workflowId is required and must be valid" },
    };
  }

  try {
    await connectMongo();

    const workflow = await Workflow.findOne({ workflowId, ownerId });

    if (!workflow) {
      ctx.logger.warn(`[getWorkflow] ⚠️ Workflow not found`, {
        workflowId,
        ownerId,
      });

      return {
        status: 404,
        body: { error: "Workflow not found" },
      };
    }

    ctx.logger.info(`[getWorkflow] ✅ Workflow found`, {
      workflowId,
      nodeCount: workflow.steps?.length || 0,
      apiName: workflow.apiName,
    });

    return {
      status: 200,
      body: {
        workflowId: workflow.workflowId,
        apiName: workflow.apiName,
        apiPath: workflow.apiPath,
        ownerId: workflow.ownerId,
        steps: workflow.steps,
        edges: workflow.edges,
        inputVariables: workflow.inputVariables,
        createdAt: workflow.createdAt,
        updatedAt: workflow.updatedAt,
      },
    };
  } catch (error: any) {
    ctx.logger.error(`[getWorkflow] ❌ Error fetching workflow`, {
      workflowId,
      error: error.message,
      stack: error.stack,
    });

    return {
      status: 500,
      body: { error: "Failed to fetch workflow" },
    };
  }
};
