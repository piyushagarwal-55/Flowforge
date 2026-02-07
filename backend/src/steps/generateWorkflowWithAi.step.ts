import { ApiRouteConfig, StepHandler } from "motia";
import { getAIProvider } from "../ai/providers/index";
import { nodeCatalog } from "../ai/nodeCatalog";
import { extractJson } from "../lib/extractJson";
import { repairJson } from "../lib/repairJson";
import { systemPrompt } from "../ai/prompts/systemPrompt";
import { schemaPrompt } from "../ai/prompts/schemaPrompt";
import { userPrompt } from "../ai/prompts/userPrompt";
import { connectMongo } from "../lib/mongo";
import Workflow from "../models/workflow.model";

export const config: ApiRouteConfig = {
  name: "generateWorkflow",
  type: "api",
  path: "/workflow/generate",
  method: "POST",
  emits: [],
  flows: ["WorkflowBuilder"],
};

/* ---------------- LABEL DEFAULTS (SAFETY NET) ---------------- */

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function defaultLabel(node: any) {
  const c = node.data?.fields?.collection;
  switch (node.type) {
    case "input":
      return "User Input";
    case "inputValidation":
      return "Validate Input";
    case "dbFind":
      return c ? `Find ${capitalize(c)}` : "Find Data";
    case "dbInsert":
      return c ? `Create ${capitalize(c)}` : "Create Data";
    case "dbUpdate":
      return c ? `Update ${capitalize(c)}` : "Update Data";
    case "dbDelete":
      return c ? `Delete ${capitalize(c)}` : "Delete Data";
    case "userLogin":
      return "User Login";
    case "emailSend":
      return "Send Email";
    case "authMiddleware":
      return "Auth Check";
    case "response":
      return "API Response";
    default:
      return node.type;
  }
}

/* ---------------- ENSURE NODE DEFAULTS ---------------- */

function ensureNodeDefaults(node: any) {
  if (!node.data) node.data = {};
  if (!node.data.fields) node.data.fields = {};

  // ✅ ENSURE LABEL
  if (!node.data.label || typeof node.data.label !== "string") {
    node.data.label = defaultLabel(node);
  }

  return node;
}

/* ---------------- FLOW VISUALIZATION ---------------- */

function buildFlowVisualization(nodes: any[], edges: any[]): string {
  // Build adjacency map
  const adj = new Map<string, string[]>();
  nodes.forEach(n => adj.set(n.id, []));
  edges.forEach(e => {
    if (adj.has(e.source)) {
      adj.get(e.source)!.push(e.target);
    }
  });

  // Find start node (no incoming edges)
  const hasIncoming = new Set(edges.map(e => e.target));
  const startNodes = nodes.filter(n => !hasIncoming.has(n.id));
  
  if (startNodes.length === 0) return "No start node found";

  // Build flow string
  const visited = new Set<string>();
  const flow: string[] = [];
  
  function traverse(nodeId: string, depth: number = 0) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    const label = `${node.id} (${node.type})`;
    flow.push(label);
    
    const children = adj.get(nodeId) || [];
    if (children.length > 0) {
      flow.push(" → ");
      children.forEach((childId, idx) => {
        if (idx > 0) flow.push(" + ");
        traverse(childId, depth + 1);
      });
    }
  }
  
  traverse(startNodes[0].id);
  return flow.join("");
}

/* ---------------- HANDLER ---------------- */

export const handler: StepHandler<typeof config> = async (req, ctx) => {
  const { prompt, workflowId, ownerId, correlationId } = req.body;
  const finalCorrelationId = correlationId || `gen-${Date.now()}`;

  ctx.logger.info(`[generateWorkflow] 📥 Request received`, {
    correlationId: finalCorrelationId,
    hasWorkflowId: !!workflowId,
    workflowId,
    prompt: prompt?.slice(0, 100),
  });

  if (!prompt) {
    return { status: 400, body: { error: "Prompt required" } };
  }

  // ✅ Initialize AI provider early (needed for both mutation and generation)
  const ai = getAIProvider(process.env.AI_PROVIDER || "groq");
  const allowedTypes = nodeCatalog.map((n) => n.type);

  // ✅ If workflowId provided, this is a MUTATION request
  if (workflowId && ownerId) {
    ctx.logger.info(`[generateWorkflow] 🔄 Calling mutation logic`, {
      correlationId: finalCorrelationId,
      workflowId,
      ownerId,
    });

    try {
      await connectMongo();

      // Load existing workflow
      const workflowDoc = await Workflow.findOne({ workflowId, ownerId });

      if (!workflowDoc) {
        ctx.logger.warn(`[generateWorkflow] ⚠️ Workflow not found in DB`, {
          correlationId: finalCorrelationId,
          workflowId,
          ownerId,
          message: "Will generate new workflow and save it",
        });
        // Fall through to generate new workflow
      } else {
        // Build mutation prompt
        const existingWorkflow = {
          nodes: workflowDoc.steps || [],
          edges: workflowDoc.edges || [], // ✅ Load existing edges
        };

        const nodeCountBefore = existingWorkflow.nodes.length;

        ctx.logger.info(`[generateWorkflow] 📊 PRE_GRAPH - Existing workflow loaded`, {
          correlationId: finalCorrelationId,
          nodeCountBefore,
          existingNodes: existingWorkflow.nodes.map((n: any) => ({
            id: n.id,
            type: n.type,
            label: n.data?.label,
          })),
        });

        // Find Response node and what's connected to it (for prompt context)
        const responseNodeForPrompt = existingWorkflow.nodes.find((n: any) => n.type === "response");
        const edgesToResponseForPrompt = responseNodeForPrompt 
          ? existingWorkflow.edges.filter((e: any) => e.target === responseNodeForPrompt.id)
          : [];
        const nodesConnectedToResponse = edgesToResponseForPrompt.map((e: any) => {
          const node = existingWorkflow.nodes.find((n: any) => n.id === e.source);
          return node ? `${node.id} (${node.type})` : e.source;
        });

        // Generate workflow summary for context
        const nodesSummary = existingWorkflow.nodes
          .map((n: any, idx: number) => `${idx + 1}. ID: ${n.id}, Type: ${n.type}, Label: ${n.data?.label || n.type}`)
          .join("\n");
        
        const responseInfo = responseNodeForPrompt 
          ? `\nResponse Node: ${responseNodeForPrompt.id}\nCurrently connected from: ${nodesConnectedToResponse.join(", ") || "none"}`
          : "";

        const mutationPrompt = `
You are modifying an EXISTING workflow. Do NOT create a separate workflow.

EXISTING WORKFLOW:
Nodes (${existingWorkflow.nodes.length}):
${nodesSummary}${responseInfo}

USER REQUEST: ${prompt}

CRITICAL INSTRUCTIONS:
1. ANALYZE the existing workflow to understand its flow
2. IDENTIFY where the new functionality should be inserted
3. DO NOT duplicate existing functionality - reuse existing nodes
4. ADD ONLY the minimal new nodes needed
5. CONNECT new nodes to existing nodes using their IDs
6. Include proper field configuration for new nodes

DUPLICATION RULES:
- If a node type already exists with similar purpose, DON'T add another
- Example: If dbInsert for users exists, DON'T add another dbInsert for users
- Only add nodes for NEW functionality not present in existing workflow

INTEGRATION RULES:
- **CRITICAL: Identify the LAST operational node (the one currently connected to Response)**
- **Insert new nodes BETWEEN that node and Response**
- If adding JWT: Find the node connected to Response (e.g., dbInsert), insert JWT between them
  Example: dbInsert → Response becomes dbInsert → JWT → Response
- If adding authentication: Insert auth check BEFORE database operations
- If adding validation: Insert AFTER input, BEFORE database operations  
- If adding email: Find the node connected to Response, insert email between them
  Example: JWT → Response becomes JWT → Email → Response
- **CRITICAL: Response node must ALWAYS be the final node in the workflow**
- **CRITICAL: New nodes should connect in a chain, not branch randomly**
- ALWAYS connect new nodes to existing nodes
- Use existing node IDs: ${existingWorkflow.nodes.map((n: any) => n.id).join(", ")}

EDGE GENERATION RULES:
1. Find the current edge TO Response (e.g., "step3 → step4" where step4 is Response)
2. Remove that edge (don't include it in addedEdges)
3. Create new edges: "step3 → newNode → step4"
4. DO NOT create edges that branch away from the main flow

FIELD CONFIGURATION:
- authMiddleware: Include fields.jwtSecret, fields.algorithm
- dbInsert: Include fields.collection, fields.data, fields.outputVar
- dbFind: Include fields.collection, fields.filters, fields.outputVar
- response: Include fields.statusCode, fields.body

EXAMPLE - Adding JWT to signup (3 existing nodes):
Existing: step1 (input) → step2 (dbInsert users) → step3 (response)
Add: step4 (authMiddleware with JWT config)
Connect: step2 → step4 → step3 (response stays LAST!)
Result: 4 nodes total (NOT 5 or 6!)

EXAMPLE - Adding email to signup with JWT (4 existing nodes):
Existing: step1 (input) → step2 (dbInsert) → step4 (JWT) → step3 (response)
Add: step5 (emailSend)
Connect: step4 → step5 → step3 (response stays LAST!)
Result: step1 → step2 → step4 (JWT) → step5 (email) → step3 (response)

Return a JSON object with ONLY additions:
{
  "addedNodes": [
    {
      "id": "step4",
      "type": "authMiddleware",
      "data": {
        "label": "Generate JWT",
        "fields": {
          "jwtSecret": "{{env.JWT_SECRET}}",
          "algorithm": "HS256"
        }
      }
    }
  ],
  "addedEdges": [
    { "id": "edge3", "source": "step2", "target": "step4" },
    { "id": "edge4", "source": "step4", "target": "step3" }
  ],
  "reasoning": "Added JWT generation between user creation and response"
}

Available node types: ${nodeCatalog.map((n) => n.type).join(", ")}
`.trim();

        const systemPromptMutation = `
${systemPrompt}

${schemaPrompt}

CRITICAL: You are MODIFYING an existing workflow, NOT creating a new one.

MUTATION RULES:
1. Return ONLY new nodes and edges to ADD
2. Do NOT return existing nodes or edges
3. New edges MUST connect to existing nodes (use their IDs)
4. Think about WHERE in the flow the new functionality belongs
5. Integrate new nodes into the existing flow, don't create parallel flows

EXAMPLE - Adding JWT to a signup workflow:
Existing: input → validation → dbInsert → response
Mutation: Add JWT generation BEFORE response
New edges: dbInsert → jwtGenerate, jwtGenerate → response
`.trim();

        ctx.logger.info(`[generateWorkflow] 🤖 Calling Groq for mutation`, {
          correlationId: finalCorrelationId,
        });

        let raw: string = "";
        let cleaned: string = "";
        let repaired: string = "";
        let mutation: any;
        try {
          raw = await ai.generateWorkflow(mutationPrompt, systemPromptMutation);
          
          ctx.logger.info(`[generateWorkflow] 📄 Raw Groq response`, {
            correlationId: finalCorrelationId,
            responseLength: raw?.length || 0,
            preview: raw?.slice(0, 200),
          });
          
          cleaned = extractJson(raw);
          repaired = repairJson(cleaned);
          mutation = JSON.parse(repaired);
          
          // Validate mutation response - check for addedNodes (new format)
          if (!mutation.addedNodes || !Array.isArray(mutation.addedNodes)) {
            throw new Error("Invalid mutation response: missing or invalid addedNodes array");
          }
          
        } catch (parseError: any) {
          ctx.logger.error(`[generateWorkflow] ❌ Failed to parse Groq response`, {
            correlationId: finalCorrelationId,
            error: parseError.message,
            rawLength: raw?.length || 0,
            rawPreview: raw?.slice(0, 500),
            cleaned: cleaned?.slice(0, 500),
            repaired: repaired?.slice(0, 500),
          });
          throw parseError; // Re-throw to fall back to generation
        }

        ctx.logger.info(`[generateWorkflow] 📝 AI_DIFF - Groq response received`, {
          correlationId: finalCorrelationId,
          addedNodesCount: mutation.addedNodes?.length || 0,
          addedEdgesCount: mutation.addedEdges?.length || 0,
          reasoning: mutation.reasoning,
        });

        // Log what's being added
        if (mutation.addedNodes && mutation.addedNodes.length > 0) {
          ctx.logger.info(`[generateWorkflow] ➕ ADDED_NODES`, {
            correlationId: finalCorrelationId,
            nodes: mutation.addedNodes.map((n: any) => ({
              id: n.id,
              type: n.type,
              label: n.data?.label,
            })),
          });
        }

        if (mutation.addedEdges && mutation.addedEdges.length > 0) {
          ctx.logger.info(`[generateWorkflow] ➕ ADDED_EDGES`, {
            correlationId: finalCorrelationId,
            edges: mutation.addedEdges,
          });
        }

        // Sanitize and apply defaults to new nodes only
        const sanitizedNewNodes = (mutation.addedNodes || [])
          .filter((n: any) => allowedTypes.includes(n.type))
          .map(ensureNodeDefaults)
          .map((node: any) => ({
            ...node,
            data: {
              ...node.data,
              _isNew: true, // Mark for frontend highlighting
            },
          }));

        // ═══════════════════════════════════════════════════════════════
        // DETERMINISTIC NORMALIZATION: RESPONSE NODE MUST BE LAST
        // ═══════════════════════════════════════════════════════════════
        
        let updatedNodes: any[];
        let updatedEdges: any[];
        let nodeCountAfter: number;
        let nodesAdded: number;
        
        // Step 1: Detect Response node in existing workflow
        const responseNode = existingWorkflow.nodes.find((n: any) => n.type === "response");
        
        if (responseNode) {
          ctx.logger.info(`[generateWorkflow] 🎯 RESPONSE_NODE_DETECTED`, {
            correlationId: finalCorrelationId,
            responseNodeId: responseNode.id,
            responseNodeLabel: responseNode.data?.label,
          });
          
          // Step 2: Save edges that pointed TO Response (we'll rewire these later)
          const edgesToResponse = (existingWorkflow.edges || []).filter((e: any) => 
            e.target === responseNode.id
          );
          
          // Step 3: Temporarily remove Response node and its edges
          const nodesWithoutResponse = existingWorkflow.nodes.filter((n: any) => n.type !== "response");
          
          // CRITICAL: Remove ALL edges involving Response node
          // This includes edges TO response (which we'll rewire) and FROM response (invalid)
          const edgesWithoutResponse = (existingWorkflow.edges || []).filter((e: any) => 
            e.source !== responseNode.id && e.target !== responseNode.id
          );
          
          ctx.logger.info(`[generateWorkflow] 🔧 Response node temporarily removed`, {
            correlationId: finalCorrelationId,
            nodesWithoutResponse: nodesWithoutResponse.length,
            edgesWithoutResponse: edgesWithoutResponse.length,
            edgesToResponse: edgesToResponse.length,
            originalEdgeCount: existingWorkflow.edges?.length || 0,
          });
          
          // Step 3: Apply addedNodes and addedEdges to the remaining graph
          // CRITICAL: Deduplicate nodes by ID and regenerate IDs for conflicts
          // Include response node ID in the check to prevent conflicts
          const existingNodeIds = new Set([
            ...nodesWithoutResponse.map((n: any) => n.id),
            responseNode.id, // ← Include response node ID
          ]);
          const idMapping = new Map<string, string>(); // old ID -> new ID
          
          const trulyNewNodes = sanitizedNewNodes.map((n: any) => {
            if (existingNodeIds.has(n.id)) {
              // Generate a unique ID for conflicting nodes
              const newId = `${n.type}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
              idMapping.set(n.id, newId);
              
              ctx.logger.warn(`[generateWorkflow] ⚠️ Duplicate node ID detected, regenerating`, {
                correlationId: finalCorrelationId,
                originalId: n.id,
                newId,
                nodeType: n.type,
              });
              return { ...n, id: newId };
            }
            return n;
          });
          
          if (trulyNewNodes.length < sanitizedNewNodes.length) {
            ctx.logger.warn(`[generateWorkflow] ⚠️ Duplicate nodes detected and removed`, {
              correlationId: finalCorrelationId,
              attemptedToAdd: sanitizedNewNodes.length,
              actuallyAdded: trulyNewNodes.length,
              duplicateIds: sanitizedNewNodes
                .filter((n: any) => existingNodeIds.has(n.id))
                .map((n: any) => n.id),
            });
          }
          
          const intermediateNodes = [...nodesWithoutResponse, ...trulyNewNodes];
          
          // CRITICAL: Deduplicate edges by ID and update references to remapped node IDs
          const existingEdgeIds = new Set(edgesWithoutResponse.map((e: any) => e.id));
          const trulyNewEdges = (mutation.addedEdges || [])
            .filter((e: any) => !existingEdgeIds.has(e.id))
            .map((e: any) => ({
              ...e,
              source: idMapping.get(e.source) || e.source,
              target: idMapping.get(e.target) || e.target,
            }));
          
          if (trulyNewEdges.length < (mutation.addedEdges || []).length) {
            ctx.logger.warn(`[generateWorkflow] ⚠️ Duplicate edges detected and removed`, {
              correlationId: finalCorrelationId,
              attemptedToAdd: mutation.addedEdges?.length || 0,
              actuallyAdded: trulyNewEdges.length,
              duplicateIds: (mutation.addedEdges || [])
                .filter((e: any) => existingEdgeIds.has(e.id))
                .map((e: any) => e.id),
            });
          }
          
          const intermediateEdges = [...edgesWithoutResponse, ...trulyNewEdges];
          
          // Step 5: Rewire edges so Response is terminal
          // CRITICAL: Response must ALWAYS be the last node
          // Strategy: Use AI-generated edges but ensure Response is terminal
          
          // Remove any edges from mutation that point FROM response (invalid)
          const validNewEdges = trulyNewEdges.filter((e: any) => 
            e.source !== responseNode.id
          );
          
          // Build intermediate edge list (all edges except those to/from Response)
          const edgesBetweenNodes = [
            ...edgesWithoutResponse,
            ...validNewEdges.filter((e: any) => e.target !== responseNode.id)
          ];
          
          ctx.logger.info(`[generateWorkflow] 🔍 Building operational graph`, {
            correlationId: finalCorrelationId,
            existingEdges: edgesWithoutResponse.length,
            newEdges: validNewEdges.filter((e: any) => e.target !== responseNode.id).length,
            totalEdges: edgesBetweenNodes.length,
          });
          
          // Find terminal operational nodes (nodes with no outgoing edges in the operational graph)
          const nodesWithOutgoingEdges = new Set(
            edgesBetweenNodes.map((e: any) => e.source)
          );
          
          // Terminal nodes are those that exist but have no outgoing edges
          const terminalNodes = intermediateNodes.filter((n: any) => 
            !nodesWithOutgoingEdges.has(n.id)
          );
          
          ctx.logger.info(`[generateWorkflow] 🎯 Identified terminal nodes`, {
            correlationId: finalCorrelationId,
            totalOperationalNodes: intermediateNodes.length,
            nodesWithOutgoingEdges: nodesWithOutgoingEdges.size,
            terminalNodeCount: terminalNodes.length,
            terminalNodeIds: terminalNodes.map((n: any) => n.id),
          });
          
          // Create edges from ALL terminal nodes to Response
          // This allows for branching flows where multiple paths converge at Response
          const newEdgesToResponse = terminalNodes.map((n: any) => ({
            id: `edge_to_response_${n.id}`,
            source: n.id,
            target: responseNode.id,
          }));
          
          // Fallback: If no terminal nodes found, connect from the last added node
          if (newEdgesToResponse.length === 0 && trulyNewNodes.length > 0) {
            const lastNewNode = trulyNewNodes[trulyNewNodes.length - 1];
            newEdgesToResponse.push({
              id: `edge_to_response_${lastNewNode.id}`,
              source: lastNewNode.id,
              target: responseNode.id,
            });
            
            ctx.logger.warn(`[generateWorkflow] ⚠️ No terminal nodes found, connecting last new node to Response`, {
              correlationId: finalCorrelationId,
              lastNewNodeId: lastNewNode.id,
            });
          }
          
          // Fallback: If still no edges to response, keep the old ones
          if (newEdgesToResponse.length === 0) {
            newEdgesToResponse.push(...edgesToResponse);
            
            ctx.logger.info(`[generateWorkflow] 🔄 No new terminal nodes, keeping OLD edges to Response`, {
              correlationId: finalCorrelationId,
              oldEdgesCount: edgesToResponse.length,
            });
          }
          
          // Remove duplicate edges to Response (keep only one per source)
          const uniqueEdgesToResponse = Array.from(
            new Map(newEdgesToResponse.map(e => [e.source, e])).values()
          );
          
          // Build final edge list
          const finalEdges = [...edgesBetweenNodes, ...uniqueEdgesToResponse];
          
          // Step 4: Reinsert Response node as the LAST node
          const finalNodes = [...intermediateNodes, responseNode];
          
          ctx.logger.info(`[generateWorkflow] ✅ RESPONSE_NODE_REINSERTED_LAST`, {
            correlationId: finalCorrelationId,
            responseNodeId: responseNode.id,
            finalNodeCount: finalNodes.length,
            finalEdgeCount: finalEdges.length,
            responseNodePosition: finalNodes.length - 1,
            edgesToResponse: uniqueEdgesToResponse.length,
            edgesToResponseDetails: uniqueEdgesToResponse.map((e: any) => ({
              id: e.id,
              source: e.source,
              target: e.target,
            })),
          });
          
          // ═══════════════════════════════════════════════════════════════
          // VERIFICATION: Response node MUST be last
          // ═══════════════════════════════════════════════════════════════
          const lastNode = finalNodes[finalNodes.length - 1];
          if (lastNode.type !== "response") {
            ctx.logger.error(`[generateWorkflow] ❌ CRITICAL: Response node is NOT last!`, {
              correlationId: finalCorrelationId,
              lastNodeType: lastNode.type,
              lastNodeId: lastNode.id,
              responseNodeId: responseNode.id,
            });
            throw new Error("Response node must be the last node in the workflow");
          }
          
          console.log("\n" + "═".repeat(60));
          console.log("RESPONSE_NODE_DETECTED:", responseNode.id);
          console.log("RESPONSE_NODE_REINSERTED_LAST");
          console.log("Node Order:", finalNodes.map((n: any) => `${n.id}(${n.type})`).join(" → "));
          console.log("Response Position:", finalNodes.length - 1, "of", finalNodes.length);
          console.log("✅ RESPONSE NODE ORDER VERIFIED");
          console.log("═".repeat(60) + "\n");
          
          // Use normalized graph
          updatedNodes = finalNodes;
          updatedEdges = finalEdges;
          nodeCountAfter = updatedNodes.length;
          nodesAdded = sanitizedNewNodes.length;

          ctx.logger.info(`[generateWorkflow] 📈 POST_GRAPH - Mutation complete`, {
            correlationId: finalCorrelationId,
            nodeCountBefore,
            nodeCountAfter,
            nodesAdded,
            edgesAdded: mutation.addedEdges?.length || 0,
            newNodes: sanitizedNewNodes.map((n: any) => ({
              id: n.id,
              type: n.type,
              label: n.data?.label,
            })),
            nodeOrder: updatedNodes.map((n: any) => n.id),
          });

          // Save mutated workflow
          workflowDoc.steps = updatedNodes;
          workflowDoc.edges = updatedEdges;
          await workflowDoc.save();
        } else {
          // No response node - use simple append (original behavior)
          updatedNodes = [...existingWorkflow.nodes, ...sanitizedNewNodes];
          updatedEdges = [...(existingWorkflow.edges || []), ...(mutation.addedEdges || [])];
          nodeCountAfter = updatedNodes.length;
          nodesAdded = sanitizedNewNodes.length;

          ctx.logger.info(`[generateWorkflow] 📈 POST_GRAPH - Mutation complete (no response node)`, {
            correlationId: finalCorrelationId,
            nodeCountBefore,
            nodeCountAfter,
            nodesAdded,
            edgesAdded: mutation.addedEdges?.length || 0,
            newNodes: sanitizedNewNodes.map((n: any) => ({
              id: n.id,
              type: n.type,
              label: n.data?.label,
            })),
          });

          // Save mutated workflow
          workflowDoc.steps = updatedNodes;
          workflowDoc.edges = updatedEdges;
          await workflowDoc.save();
        }

        ctx.logger.info(`[generateWorkflow] 💾 Mutated workflow saved`, {
          correlationId: finalCorrelationId,
          workflowId,
        });

        // ✅ LOG FINAL WORKFLOW STRUCTURE
        ctx.logger.info(`[generateWorkflow] 🎯 FINAL WORKFLOW STRUCTURE`, {
          correlationId: finalCorrelationId,
          totalNodes: updatedNodes.length,
          totalEdges: updatedEdges.length,
          nodes: updatedNodes.map((n: any) => ({
            id: n.id,
            type: n.type,
            label: n.data?.label || n.type,
            isNew: n.data?._isNew || false,
          })),
          edges: updatedEdges.map((e: any) => ({
            id: e.id,
            source: e.source,
            target: e.target,
          })),
          flowVisualization: buildFlowVisualization(updatedNodes, updatedEdges),
          nodeOrder: updatedNodes.map((n: any) => n.id),
          lastNodeType: updatedNodes[updatedNodes.length - 1]?.type,
          responseNodeIsLast: updatedNodes[updatedNodes.length - 1]?.type === "response",
        });

        return {
          status: 200,
          body: {
            nodes: updatedNodes,
            edges: updatedEdges,
            metadata: {
              generatedAt: new Date().toISOString(),
              prompt: prompt.slice(0, 200),
              correlationId: finalCorrelationId,
              isMutation: true,
              nodeCountBefore,
              nodeCountAfter,
              nodesAdded,
              edgesAdded: mutation.addedEdges?.length || 0,
            },
          },
        };
      }
    } catch (error: any) {
      ctx.logger.error(`[generateWorkflow] ❌ Mutation failed`, {
        correlationId: finalCorrelationId,
        error: error.message,
        stack: error.stack,
      });
      // Fall through to generate new workflow
    }
  }

  // ✅ Generate NEW workflow (fallback or first-time)
  const finalSystem = `
${systemPrompt}

${schemaPrompt}
`.trim();

  const finalUser = userPrompt(prompt, nodeCatalog);

  ctx.logger.info(`[generateWorkflow] 🤖 Calling Groq for generation`, {
    correlationId: finalCorrelationId,
  });

  const raw = await ai.generateWorkflow(finalUser, finalSystem);
  const cleaned = extractJson(raw);
  const repaired = repairJson(cleaned);
  const workflow = JSON.parse(repaired);

  // Log nodes before filtering
  const nodesBeforeFilter = workflow.nodes?.length || 0;
  const nodeTypesBefore = workflow.nodes?.map((n: any) => n.type) || [];

  // sanitize + label enforce
  workflow.nodes = workflow.nodes
    .filter((n: any) => {
      const isAllowed = allowedTypes.includes(n.type);
      if (!isAllowed) {
        ctx.logger.warn(`[generateWorkflow] ⚠️ Filtering out unsupported node type`, {
          correlationId: finalCorrelationId,
          nodeId: n.id,
          nodeType: n.type,
          allowedTypes,
        });
      }
      return isAllowed;
    })
    .map(ensureNodeDefaults);

  const nodesAfterFilter = workflow.nodes?.length || 0;
  const nodesFiltered = nodesBeforeFilter - nodesAfterFilter;

  ctx.logger.info(`[generateWorkflow] ✅ Workflow generated`, {
    correlationId: finalCorrelationId,
    nodeCount: workflow.nodes?.length || 0,
    edgeCount: workflow.edges?.length || 0,
    nodesFiltered: nodesFiltered > 0 ? nodesFiltered : undefined,
    nodeTypesBefore: nodesFiltered > 0 ? nodeTypesBefore : undefined,
  });

  // ✅ Save workflow to database if workflowId and ownerId provided
  // BUT: Only save if this was a NEW workflow generation, not a failed mutation fallback
  if (workflowId && ownerId) {
    // Check if this is a fallback from failed mutation
    // If mutation was attempted but failed, we shouldn't overwrite the existing workflow
    try {
      await connectMongo();
      
      // Check if workflow already exists
      const existingWorkflow = await Workflow.findOne({ workflowId, ownerId });
      
      if (existingWorkflow && existingWorkflow.steps && existingWorkflow.steps.length > 0) {
        // Workflow exists - this might be a failed mutation fallback
        // Don't overwrite unless the new workflow has more nodes
        if (workflow.nodes.length <= existingWorkflow.steps.length) {
          ctx.logger.warn(`[generateWorkflow] ⚠️ Not saving - new workflow has fewer nodes`, {
            correlationId: finalCorrelationId,
            workflowId,
            existingNodeCount: existingWorkflow.steps.length,
            newNodeCount: workflow.nodes.length,
            message: "This appears to be a failed mutation fallback - preserving existing workflow",
          });
          
          // Return the existing workflow instead
          return {
            status: 200,
            body: {
              nodes: existingWorkflow.steps,
              edges: workflow.edges, // Use new edges
              metadata: {
                generatedAt: new Date().toISOString(),
                prompt: prompt.slice(0, 200),
                correlationId: finalCorrelationId,
                preservedExisting: true,
                message: "Mutation failed - existing workflow preserved",
              },
            },
          };
        }
      }

      const savedWorkflow = await Workflow.findOneAndUpdate(
        { workflowId, ownerId },
        {
          steps: workflow.nodes,
          edges: workflow.edges || [], // ✅ Save edges
          inputVariables: [],
        },
        { upsert: true, new: true }
      );

      ctx.logger.info(`[generateWorkflow] 💾 Workflow saved to database`, {
        correlationId: finalCorrelationId,
        workflowId,
        ownerId,
        nodeCount: workflow.nodes?.length || 0,
        savedId: savedWorkflow._id,
      });
    } catch (error: any) {
      ctx.logger.error(`[generateWorkflow] ⚠️ Failed to save workflow`, {
        correlationId: finalCorrelationId,
        workflowId,
        ownerId,
        error: error.message,
        stack: error.stack,
      });
      // Don't fail the request, just log the error
    }
  }

  return {
    status: 200,
    body: {
      ...workflow,
      metadata: {
        generatedAt: new Date().toISOString(),
        prompt: prompt.slice(0, 200),
        correlationId: finalCorrelationId,
      },
    },
  };
};
