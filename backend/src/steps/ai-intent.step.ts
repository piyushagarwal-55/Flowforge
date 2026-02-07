import { ApiRouteConfig, StepHandler } from "motia";
import { v4 as uuidv4 } from "uuid";
import { connectMongo } from "../lib/mongo";
import Workflow from "../models/workflow.model";

export const config: ApiRouteConfig = {
  name: "aiIntent",
  type: "api",
  path: "/ai/intent",
  method: "POST",
  emits: [],
};

interface IntentRequest {
  prompt: string;
  correlationId?: string;
  workflowId?: string; // ✅ NEW: Support existing workflow
  ownerId?: string;
}

interface IntentResponse {
  workflowPrompt?: string;
  components: string[];
  correlationId: string;
  workflowId?: string; // ✅ NEW: Return workflowId for session tracking
  isNewWorkflow?: boolean; // ✅ NEW: Indicate if this is a new workflow
  existingNodeCount?: number; // ✅ NEW: For logging
}

export const handler: StepHandler<typeof config> = async (req, ctx) => {
  const { prompt, correlationId, workflowId, ownerId } = req.body as IntentRequest;
  const finalCorrelationId = correlationId || `intent-${Date.now()}`;
  // ✅ FIX: Use consistent ownerId - don't generate new one each time
  const finalOwnerId = ownerId || "user_default";

  ctx.logger.info(`[aiIntent] 📥 Intent request received`, {
    correlationId: finalCorrelationId,
    prompt: prompt?.slice(0, 100),
    hasWorkflowId: !!workflowId,
    workflowId,
    ownerId: finalOwnerId,
    timestamp: new Date().toISOString(),
  });

  if (!prompt || typeof prompt !== "string") {
    ctx.logger.error(`[aiIntent] ❌ Invalid prompt`, {
      correlationId: finalCorrelationId,
    });
    return {
      status: 400,
      body: { error: "Prompt is required" },
    };
  }

  try {
    await connectMongo();

    // ✅ Check if workflow exists
    let existingWorkflow = null;
    let existingNodeCount = 0;
    let isNewWorkflow = true;
    let activeWorkflowId = workflowId;

    if (workflowId) {
      ctx.logger.info(`[aiIntent] 🔍 Looking for existing workflow`, {
        correlationId: finalCorrelationId,
        workflowId,
        ownerId: finalOwnerId,
      });

      existingWorkflow = await Workflow.findOne({ workflowId, ownerId: finalOwnerId });
      
      if (existingWorkflow) {
        existingNodeCount = existingWorkflow.steps?.length || 0;
        isNewWorkflow = false;

        ctx.logger.info(`[aiIntent] 📊 Existing workflow found`, {
          correlationId: finalCorrelationId,
          workflowId,
          nodeCount: existingNodeCount,
          nodes: existingWorkflow.steps?.map((n: any) => ({
            id: n.id,
            type: n.type,
            label: n.data?.label,
          })),
        });
      } else {
        ctx.logger.warn(`[aiIntent] ⚠️ Workflow not found in database`, {
          correlationId: finalCorrelationId,
          workflowId,
          ownerId: finalOwnerId,
          message: "Workflow might not be saved yet or this is first message",
        });
        // ✅ Keep the workflowId and treat as continuation
        // The workflow will be created/updated on generation
        isNewWorkflow = false; // Treat as continuation to maintain workflowId
        existingNodeCount = 0;
      }
    }

    // ✅ If no existing workflow, generate new workflowId
    if (!activeWorkflowId) {
      activeWorkflowId = `workflow_${Date.now()}_${uuidv4().slice(0, 8)}`;
      isNewWorkflow = true;

      ctx.logger.info(`[aiIntent] 🆕 Creating new workflow`, {
        correlationId: finalCorrelationId,
        workflowId: activeWorkflowId,
      });
    }

    // Analyze intent from prompt
    const lowerPrompt = prompt.toLowerCase();
    const components: string[] = [];
    let workflowPrompt: string | undefined;

    // ✅ NEW: Detect mutation intent (add, modify, update, change, remove, send)
    const isMutationIntent = 
      existingWorkflow && 
      existingNodeCount > 0 &&
      (
        lowerPrompt.includes("add") ||
        lowerPrompt.includes("modify") ||
        lowerPrompt.includes("update") ||
        lowerPrompt.includes("change") ||
        lowerPrompt.includes("remove") ||
        lowerPrompt.includes("delete") ||
        lowerPrompt.includes("include") ||
        lowerPrompt.includes("also") ||
        lowerPrompt.includes("plus") ||
        lowerPrompt.includes("with") ||
        lowerPrompt.includes("send") ||
        lowerPrompt.includes("email")
      );

    if (isMutationIntent) {
      components.push("WorkflowGraph");
      workflowPrompt = prompt; // This will trigger mutation in generateWorkflow

      ctx.logger.info(`[aiIntent] 🔄 Workflow mutation detected`, {
        correlationId: finalCorrelationId,
        existingNodeCount,
        mutationPrompt: prompt,
      });
    }
    // Detect workflow creation intent
    else if (
      lowerPrompt.includes("create") ||
      lowerPrompt.includes("build") ||
      lowerPrompt.includes("make") ||
      lowerPrompt.includes("api") ||
      lowerPrompt.includes("workflow")
    ) {
      components.push("WorkflowGraph");
      workflowPrompt = prompt;

      ctx.logger.info(`[aiIntent] 🎯 Workflow creation detected`, {
        correlationId: finalCorrelationId,
        components: ["WorkflowGraph"],
      });
    }

    // Detect deployment intent
    if (
      lowerPrompt.includes("deploy") ||
      lowerPrompt.includes("publish") ||
      lowerPrompt.includes("launch")
    ) {
      components.push("DeployPanel");

      ctx.logger.info(`[aiIntent] 🚀 Deployment intent detected`, {
        correlationId: finalCorrelationId,
      });
    }

    // Detect execution/testing intent
    if (
      lowerPrompt.includes("run") ||
      lowerPrompt.includes("test") ||
      lowerPrompt.includes("execute") ||
      lowerPrompt.includes("try")
    ) {
      components.push("ExecutionLogs");

      ctx.logger.info(`[aiIntent] ▶️ Execution intent detected`, {
        correlationId: finalCorrelationId,
      });
    }

    // Detect API testing intent
    if (
      lowerPrompt.includes("playground") ||
      lowerPrompt.includes("test api") ||
      lowerPrompt.includes("try api")
    ) {
      components.push("APIPlayground");

      ctx.logger.info(`[aiIntent] 🎮 API playground intent detected`, {
        correlationId: finalCorrelationId,
      });
    }

    // Detect inspection intent
    if (
      lowerPrompt.includes("inspect") ||
      lowerPrompt.includes("examine") ||
      lowerPrompt.includes("look at") ||
      lowerPrompt.includes("show me")
    ) {
      // Always include WorkflowGraph for inspection
      if (!components.includes("WorkflowGraph")) {
        components.push("WorkflowGraph");
      }
      components.push("NodeInspector");

      ctx.logger.info(`[aiIntent] 🔍 Inspection intent detected`, {
        correlationId: finalCorrelationId,
      });
    }

    // Detect explain intent
    if (
      lowerPrompt.includes("explain") ||
      lowerPrompt.includes("what does") ||
      lowerPrompt.includes("describe") ||
      lowerPrompt.includes("how does")
    ) {
      components.push("BackendExplainer");

      ctx.logger.info(`[aiIntent] 📖 Explain intent detected`, {
        correlationId: finalCorrelationId,
      });
    }

    // Default: if no specific intent, show workflow graph
    if (components.length === 0) {
      components.push("WorkflowGraph");
      workflowPrompt = prompt;

      ctx.logger.info(`[aiIntent] 📊 Default to workflow creation`, {
        correlationId: finalCorrelationId,
      });
    }

    const response: IntentResponse = {
      workflowPrompt,
      components,
      correlationId: finalCorrelationId,
      workflowId: activeWorkflowId, // ✅ NEW: Return workflowId
      isNewWorkflow, // ✅ NEW: Indicate if new
      existingNodeCount, // ✅ NEW: For frontend logging
    };

    ctx.logger.info(`[aiIntent] ✅ Intent response prepared`, {
      correlationId: finalCorrelationId,
      components,
      hasWorkflowPrompt: !!workflowPrompt,
      workflowId: activeWorkflowId,
      isNewWorkflow,
      existingNodeCount,
    });

    return {
      status: 200,
      body: response,
    };
  } catch (error: any) {
    ctx.logger.error(`[aiIntent] ❌ Error processing intent`, {
      correlationId: finalCorrelationId,
      error: error.message,
      stack: error.stack,
    });

    return {
      status: 500,
      body: {
        error: "Failed to process intent",
        correlationId: finalCorrelationId,
      },
    };
  }
};
