import { ApiRouteConfig, StepHandler } from "motia";
import { getAIProvider } from "../ai/providers/index";
import { nodeCatalog } from "../ai/nodeCatalog";
import { extractJson } from "../lib/extractJson";
import { repairJson } from "../lib/repairJson";
import { connectMongo } from "../lib/mongo";
import Workflow from "../models/workflow.model";
import { v4 as uuidv4 } from "uuid";

export const config: ApiRouteConfig = {
  name: "workflowMutation",
  type: "api",
  path: "/workflow/mutate",
  method: "POST",
  emits: [],
};

/**
 * CONVERSATIONAL WORKFLOW MUTATION
 * 
 * This endpoint enables iterative workflow building through conversation.
 * Instead of generating a new workflow each time, it modifies the existing one.
 * 
 * Flow:
 * 1. Load existing workflow from MongoDB
 * 2. Generate workflow summary for Groq context
 * 3. Ask Groq to MODIFY workflow (not regenerate)
 * 4. Apply returned changes (add nodes, update edges)
 * 5. Preserve existing nodes
 * 6. Save mutated workflow
 * 7. Return diff for frontend highlighting
 */

interface MutationRequest {
  prompt: string;
  workflowId: string;
  ownerId: string;
  correlationId?: string;
}

interface WorkflowNode {
  id: string;
  type: string;
  data: {
    label: string;
    fields?: any;
  };
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
}

interface ExistingWorkflow {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

function generateWorkflowSummary(workflow: ExistingWorkflow): string {
  const nodesSummary = workflow.nodes
    .map((n, idx) => `${idx + 1}. ${n.type} (${n.data.label})`)
    .join("\n");

  const edgesSummary = workflow.edges
    .map((e) => {
      const source = workflow.nodes.find((n) => n.id === e.source);
      const target = workflow.nodes.find((n) => n.id === e.target);
      return `${source?.type} → ${target?.type}`;
    })
    .join("\n");

  return `
EXISTING WORKFLOW:

Nodes (${workflow.nodes.length}):
${nodesSummary}

Connections (${workflow.edges.length}):
${edgesSummary}
`.trim();
}

function buildMutationPrompt(
  userPrompt: string,
  existingWorkflow: ExistingWorkflow
): string {
  const summary = generateWorkflowSummary(existingWorkflow);

  return `
You are modifying an EXISTING workflow. Do NOT regenerate from scratch.

${summary}

USER REQUEST: ${userPrompt}

INSTRUCTIONS:
1. Keep ALL existing nodes unless explicitly asked to remove them
2. Add ONLY the new nodes needed for the user's request
3. Update edges to connect new nodes to existing workflow
4. Preserve the existing workflow structure
5. Return ONLY the new nodes to add and new edges to create

Return a JSON object with:
{
  "newNodes": [array of new nodes to add],
  "newEdges": [array of new edges to add],
  "reasoning": "brief explanation of changes"
}

Available node types: ${nodeCatalog.map((n) => n.type).join(", ")}
`.trim();
}

export const handler: StepHandler<typeof config> = async (req, ctx) => {
  const { prompt, workflowId, ownerId, correlationId } = req.body as MutationRequest;
  const finalCorrelationId = correlationId || uuidv4();

  ctx.logger.info(`[workflowMutation] 📥 Mutation request received`, {
    correlationId: finalCorrelationId,
    workflowId,
    prompt: prompt?.slice(0, 100),
  });

  // Validate input
  if (!prompt || !workflowId || !ownerId) {
    ctx.logger.error(`[workflowMutation] ❌ Missing required fields`, {
      correlationId: finalCorrelationId,
    });
    return {
      status: 400,
      body: { error: "prompt, workflowId, and ownerId are required" },
    };
  }

  try {
    await connectMongo();

    // Load existing workflow
    const workflowDoc = await Workflow.findOne({ workflowId, ownerId });

    if (!workflowDoc) {
      ctx.logger.error(`[workflowMutation] ❌ Workflow not found`, {
        correlationId: finalCorrelationId,
        workflowId,
      });
      return {
        status: 404,
        body: { error: "Workflow not found" },
      };
    }

    // Parse existing workflow
    const existingWorkflow: ExistingWorkflow = {
      nodes: workflowDoc.steps || [],
      edges: [], // Edges are derived from step connections
    };

    const nodeCountBefore = existingWorkflow.nodes.length;

    ctx.logger.info(`[workflowMutation] 📊 Loaded existing workflow`, {
      correlationId: finalCorrelationId,
      nodeCountBefore,
    });

    // Build mutation prompt
    const mutationPrompt = buildMutationPrompt(prompt, existingWorkflow);

    ctx.logger.info(`[workflowMutation] 🤖 Calling Groq for mutation`, {
      correlationId: finalCorrelationId,
    });

    // Call Groq for mutation
    const ai = getAIProvider(process.env.AI_PROVIDER || "groq");
    const systemPrompt = `You are a workflow mutation assistant. You modify existing workflows by adding new nodes and edges. Never regenerate the entire workflow.`;

    const raw = await ai.generateWorkflow(mutationPrompt, systemPrompt);
    const cleaned = extractJson(raw);
    const repaired = repairJson(cleaned);
    const mutation = JSON.parse(repaired);

    ctx.logger.info(`[workflowMutation] ✅ Groq mutation received`, {
      correlationId: finalCorrelationId,
      newNodesCount: mutation.newNodes?.length || 0,
      newEdgesCount: mutation.newEdges?.length || 0,
      reasoning: mutation.reasoning,
    });

    // Apply mutation
    const newNodes = mutation.newNodes || [];
    const newEdges = mutation.newEdges || [];

    // Ensure new nodes have unique IDs
    const updatedNodes = [
      ...existingWorkflow.nodes,
      ...newNodes.map((node: any) => ({
        ...node,
        id: node.id || `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        data: {
          ...node.data,
          _isNew: true, // Mark for frontend highlighting
        },
      })),
    ];

    const updatedEdges = [
      ...existingWorkflow.edges,
      ...newEdges.map((edge: any) => ({
        ...edge,
        id: edge.id || `edge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      })),
    ];

    const nodeCountAfter = updatedNodes.length;
    const nodesAdded = nodeCountAfter - nodeCountBefore;

    ctx.logger.info(`[workflowMutation] 📈 Mutation applied`, {
      correlationId: finalCorrelationId,
      nodeCountBefore,
      nodeCountAfter,
      nodesAdded,
      edgesAdded: newEdges.length,
    });

    // Save mutated workflow
    workflowDoc.steps = updatedNodes;
    await workflowDoc.save();

    ctx.logger.info(`[workflowMutation] 💾 Mutated workflow saved`, {
      correlationId: finalCorrelationId,
      workflowId,
    });

    return {
      status: 200,
      body: {
        workflowId,
        nodes: updatedNodes,
        edges: updatedEdges,
        diff: {
          nodesAdded,
          nodeCountBefore,
          nodeCountAfter,
          newNodeIds: newNodes.map((n: any) => n.id),
        },
        reasoning: mutation.reasoning,
        correlationId: finalCorrelationId,
      },
    };
  } catch (error: any) {
    ctx.logger.error(`[workflowMutation] ❌ Mutation failed`, {
      correlationId: finalCorrelationId,
      error: error.message,
      stack: error.stack,
    });

    return {
      status: 500,
      body: {
        error: "Failed to mutate workflow",
        details: error.message,
        correlationId: finalCorrelationId,
      },
    };
  }
};
