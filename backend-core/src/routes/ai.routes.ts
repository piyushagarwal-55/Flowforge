import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import Workflow from '../models/workflow.model';
import MCPServer from '../models/mcpServer.model';
import { getAIProvider } from '../ai/providers';
import { nodeCatalog } from '../ai/nodeCatalog';
import { extractJson } from '../utils/extractJson';
import { repairJson } from '../utils/repairJson';
import { systemPrompt } from '../ai/prompts/systemPrompt';
import { schemaPrompt } from '../ai/prompts/schemaPrompt';
import { userPrompt } from '../ai/prompts/userPrompt';
import { logger } from '../utils/logger';
import { generateMCPServer, mutateMCPServer } from '../mcp/server.generator';
import { runtimeManager } from '../mcp/runtime.manager';
import { registerBuiltInTools } from '../mcp/tool.registry';
import { supervisorAgent } from '../agents/supervisor.agent';
import { SocketServer } from '../socket';

// Register built-in MCP tools on startup
registerBuiltInTools();

export function initAIRoutes(socketServer: SocketServer) {
  const router = Router();

/**
 * POST /ai/intent
 * Analyze user intent and determine which UI components to show
 */
router.post('/intent', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { prompt, correlationId, workflowId, ownerId } = req.body;
    const finalCorrelationId = correlationId || `intent-${Date.now()}`;
    const finalOwnerId = ownerId || 'user_default';

    logger.info('[aiIntent] 📥 Intent request received', {
      correlationId: finalCorrelationId,
      prompt: prompt?.slice(0, 100),
      hasWorkflowId: !!workflowId,
      workflowId,
      ownerId: finalOwnerId,
      timestamp: new Date().toISOString(),
    });

    if (!prompt || typeof prompt !== 'string') {
      logger.error('[aiIntent] ❌ Invalid prompt', {
        correlationId: finalCorrelationId,
      });
      res.status(400).json({
        error: 'Prompt is required',
      });
      return;
    }

    // Check if workflow exists
    let existingWorkflow = null;
    let existingNodeCount = 0;
    let isNewWorkflow = true;
    let activeWorkflowId = workflowId;

    if (workflowId) {
      logger.info('[aiIntent] 🔍 Looking for existing workflow', {
        correlationId: finalCorrelationId,
        workflowId,
        ownerId: finalOwnerId,
      });

      existingWorkflow = await Workflow.findOne({ workflowId, ownerId: finalOwnerId });

      if (existingWorkflow) {
        existingNodeCount = existingWorkflow.steps?.length || 0;
        isNewWorkflow = false;

        logger.info('[aiIntent] 📊 Existing workflow found', {
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
        logger.warn('[aiIntent] ⚠️ Workflow not found in database', {
          correlationId: finalCorrelationId,
          workflowId,
          ownerId: finalOwnerId,
          message: 'Workflow might not be saved yet or this is first message',
        });
        isNewWorkflow = false;
        existingNodeCount = 0;
      }
    }

    // If no existing workflow, generate new workflowId
    if (!activeWorkflowId) {
      activeWorkflowId = `workflow_${Date.now()}_${uuidv4().slice(0, 8)}`;
      isNewWorkflow = true;

      logger.info('[aiIntent] 🆕 Creating new workflow', {
        correlationId: finalCorrelationId,
        workflowId: activeWorkflowId,
      });
    }

    // Analyze intent from prompt
    const lowerPrompt = prompt.toLowerCase();
    const components: string[] = [];
    let workflowPrompt: string | undefined;

    // Detect mutation intent
    const isMutationIntent =
      existingWorkflow &&
      existingNodeCount > 0 &&
      (lowerPrompt.includes('add') ||
        lowerPrompt.includes('modify') ||
        lowerPrompt.includes('update') ||
        lowerPrompt.includes('change') ||
        lowerPrompt.includes('remove') ||
        lowerPrompt.includes('delete') ||
        lowerPrompt.includes('include') ||
        lowerPrompt.includes('also') ||
        lowerPrompt.includes('plus') ||
        lowerPrompt.includes('with') ||
        lowerPrompt.includes('send') ||
        lowerPrompt.includes('email'));

    if (isMutationIntent) {
      components.push('WorkflowGraph');
      workflowPrompt = prompt;

      logger.info('[aiIntent] 🔄 Workflow mutation detected', {
        correlationId: finalCorrelationId,
        existingNodeCount,
        mutationPrompt: prompt,
      });
    }
    // Detect workflow creation intent
    else if (
      lowerPrompt.includes('create') ||
      lowerPrompt.includes('build') ||
      lowerPrompt.includes('make') ||
      lowerPrompt.includes('api') ||
      lowerPrompt.includes('workflow')
    ) {
      components.push('WorkflowGraph');
      workflowPrompt = prompt;

      logger.info('[aiIntent] 🎯 Workflow creation detected', {
        correlationId: finalCorrelationId,
        components: ['WorkflowGraph'],
      });
    }

    // Detect deployment intent
    if (
      lowerPrompt.includes('deploy') ||
      lowerPrompt.includes('publish') ||
      lowerPrompt.includes('launch')
    ) {
      components.push('DeployPanel');

      logger.info('[aiIntent] 🚀 Deployment intent detected', {
        correlationId: finalCorrelationId,
      });
    }

    // Detect execution/testing intent
    if (
      lowerPrompt.includes('run') ||
      lowerPrompt.includes('test') ||
      lowerPrompt.includes('execute') ||
      lowerPrompt.includes('try')
    ) {
      components.push('ExecutionLogs');

      logger.info('[aiIntent] ▶️ Execution intent detected', {
        correlationId: finalCorrelationId,
      });
    }

    // Detect API testing intent
    if (
      lowerPrompt.includes('playground') ||
      lowerPrompt.includes('test api') ||
      lowerPrompt.includes('try api')
    ) {
      components.push('APIPlayground');

      logger.info('[aiIntent] 🎮 API playground intent detected', {
        correlationId: finalCorrelationId,
      });
    }

    // Detect inspection intent
    if (
      lowerPrompt.includes('inspect') ||
      lowerPrompt.includes('examine') ||
      lowerPrompt.includes('look at') ||
      lowerPrompt.includes('show me')
    ) {
      if (!components.includes('WorkflowGraph')) {
        components.push('WorkflowGraph');
      }
      components.push('NodeInspector');

      logger.info('[aiIntent] 🔍 Inspection intent detected', {
        correlationId: finalCorrelationId,
      });
    }

    // Detect explain intent
    if (
      lowerPrompt.includes('explain') ||
      lowerPrompt.includes('what does') ||
      lowerPrompt.includes('describe') ||
      lowerPrompt.includes('how does')
    ) {
      components.push('BackendExplainer');

      logger.info('[aiIntent] 📖 Explain intent detected', {
        correlationId: finalCorrelationId,
      });
    }

    // Default: if no specific intent, show workflow graph
    if (components.length === 0) {
      components.push('WorkflowGraph');
      workflowPrompt = prompt;

      logger.info('[aiIntent] 📊 Default to workflow creation', {
        correlationId: finalCorrelationId,
      });
    }

    const response = {
      workflowPrompt,
      components,
      correlationId: finalCorrelationId,
      workflowId: activeWorkflowId,
      isNewWorkflow,
      existingNodeCount,
    };

    logger.info('[aiIntent] ✅ Intent response prepared', {
      correlationId: finalCorrelationId,
      components,
      hasWorkflowPrompt: !!workflowPrompt,
      workflowId: activeWorkflowId,
      isNewWorkflow,
      existingNodeCount,
    });

    res.status(200).json(response);
  } catch (error) {
    logger.error('[aiIntent] ❌ Error processing intent', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    next(error);
  }
});

/**
 * POST /ai/generate-mcp-server
 * Generate MCP server from natural language prompt
 * This is the new MCP-first endpoint
 * NOW ROUTES THROUGH SUPERVISORAGENT
 */
router.post('/generate-mcp-server', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { prompt, ownerId, correlationId } = req.body;
    const finalOwnerId = ownerId || 'user_default';
    const finalCorrelationId = correlationId || `mcp-${Date.now()}`;

    logger.info('[generateMCPServer] 📥 Request received', {
      correlationId: finalCorrelationId,
      prompt: prompt?.slice(0, 100),
      ownerId: finalOwnerId,
    });

    if (!prompt) {
      res.status(400).json({
        error: 'Prompt required',
      });
      return;
    }

    // Route through SupervisorAgent
    const { task, result: mcpServer, supervisorLogs } = await supervisorAgent.handleUserIntent({
      prompt,
      ownerId: finalOwnerId,
      correlationId: finalCorrelationId,
      socketServer,
      executionId: finalCorrelationId,
    });

    // Save to database
    await MCPServer.create({
      serverId: mcpServer.serverId,
      name: mcpServer.name,
      description: mcpServer.description,
      tools: mcpServer.tools,
      resources: mcpServer.resources,
      agents: mcpServer.agents,
      permissions: mcpServer.permissions,
      executionOrder: mcpServer.executionOrder,
      status: mcpServer.status,
      ownerId: mcpServer.ownerId,
    });

    logger.info('[generateMCPServer] ✅ MCP server created via SupervisorAgent', {
      correlationId: finalCorrelationId,
      taskId: task.taskId,
      serverId: mcpServer.serverId,
      toolCount: mcpServer.tools.length,
    });

    // Generate API metadata (Tambo-style publishing)
    // Use PUBLIC_URL for production, fallback to localhost for development
    const apiUrl = process.env.PUBLIC_URL || process.env.API_URL || 'http://localhost:4000';
    const apiEndpoint = `${apiUrl}/mcp/api/${mcpServer.serverId}`;
    
    // Generate example curl command
    const exampleInput = mcpServer.tools[0]?.inputSchema?.properties 
      ? Object.keys(mcpServer.tools[0].inputSchema.properties).reduce((acc, key) => {
          acc[key] = `<${key}>`;
          return acc;
        }, {} as Record<string, string>)
      : { example: 'data' };
    
    const exampleCurl = `curl -X POST ${apiEndpoint} \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(exampleInput, null, 2)}'`;
    
    // Generate example frontend fetch
    const exampleFetch = `fetch("${apiEndpoint}", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(${JSON.stringify(exampleInput, null, 2)})
})
  .then(res => res.json())
  .then(data => console.log(data));`;

    res.status(200).json({
      serverId: mcpServer.serverId,
      name: mcpServer.name,
      description: mcpServer.description,
      tools: mcpServer.tools,
      resources: mcpServer.resources,
      status: mcpServer.status,
      apiEndpoint,
      exampleCurl,
      exampleFetch,
      metadata: {
        generatedAt: mcpServer.createdAt.toISOString(),
        prompt: prompt.slice(0, 200),
        correlationId: finalCorrelationId,
        taskId: task.taskId,
        supervisorLogs, // Include supervisor logs for frontend
      },
    });
  } catch (error) {
    logger.error('[generateMCPServer] ❌ Error generating MCP server', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    next(error);
  }
});

/**
 * POST /ai/generate-workflow
 * Generate workflow from natural language prompt
 * COMPATIBILITY LAYER: Internally uses MCP server generation
 */
router.post('/generate-workflow', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { prompt, workflowId, ownerId, correlationId } = req.body;
    const finalCorrelationId = correlationId || `gen-${Date.now()}`;

    logger.info('[generateWorkflow] 📥 Request received', {
      correlationId: finalCorrelationId,
      hasWorkflowId: !!workflowId,
      workflowId,
      prompt: prompt?.slice(0, 100),
    });

    if (!prompt) {
      res.status(400).json({
        error: 'Prompt required',
      });
      return;
    }

    // Initialize AI provider
    const ai = getAIProvider(process.env.AI_PROVIDER || 'groq');
    const allowedTypes = nodeCatalog.map((n) => n.type);

    // If workflowId provided, this is a MUTATION request
    if (workflowId && ownerId) {
      logger.info('[generateWorkflow] 🔄 Mutation request detected', {
        correlationId: finalCorrelationId,
        workflowId,
        ownerId,
      });

      // Load existing workflow
      const workflowDoc = await Workflow.findOne({ workflowId, ownerId });

      if (!workflowDoc) {
        logger.warn('[generateWorkflow] ⚠️ Workflow not found, generating new', {
          correlationId: finalCorrelationId,
          workflowId,
          ownerId,
        });
        // Fall through to generate new workflow
      } else {
        // Build mutation prompt
        const existingWorkflow = {
          nodes: workflowDoc.steps || [],
          edges: workflowDoc.edges || [],
        };

        const nodeCountBefore = existingWorkflow.nodes.length;

        logger.info('[generateWorkflow] 📊 Existing workflow loaded', {
          correlationId: finalCorrelationId,
          nodeCountBefore,
          existingNodes: existingWorkflow.nodes.map((n: any) => ({
            id: n.id,
            type: n.type,
            label: n.data?.label,
          })),
        });

        // Generate workflow summary for context
        const nodesSummary = existingWorkflow.nodes
          .map((n: any, idx: number) => `${idx + 1}. ID: ${n.id}, Type: ${n.type}, Label: ${n.data?.label || n.type}`)
          .join('\n');

        const mutationPrompt = `
You are modifying an EXISTING workflow. Do NOT create a separate workflow.

EXISTING WORKFLOW:
Nodes (${existingWorkflow.nodes.length}):
${nodesSummary}

USER REQUEST: ${prompt}

CRITICAL INSTRUCTIONS:
1. ANALYZE the existing workflow to understand its flow
2. IDENTIFY where the new functionality should be inserted
3. DO NOT duplicate existing functionality - reuse existing nodes
4. ADD ONLY the minimal new nodes needed
5. CONNECT new nodes to existing nodes using their IDs

Return a JSON object with ONLY additions:
{
  "addedNodes": [array of new nodes to add],
  "addedEdges": [array of new edges to add],
  "reasoning": "brief explanation of changes"
}

Available node types: ${nodeCatalog.map((n) => n.type).join(', ')}
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
`.trim();

        logger.info('[generateWorkflow] 🤖 Calling AI for mutation', {
          correlationId: finalCorrelationId,
        });

        try {
          const raw = await ai.generateWorkflow(mutationPrompt, systemPromptMutation);
          const cleaned = extractJson(raw);
          const repaired = repairJson(cleaned);
          const mutation = JSON.parse(repaired);

          if (!mutation.addedNodes || !Array.isArray(mutation.addedNodes)) {
            throw new Error('Invalid mutation response: missing or invalid addedNodes array');
          }

          logger.info('[generateWorkflow] 📝 AI mutation received', {
            correlationId: finalCorrelationId,
            addedNodesCount: mutation.addedNodes?.length || 0,
            addedEdgesCount: mutation.addedEdges?.length || 0,
            reasoning: mutation.reasoning,
          });

          // Sanitize new nodes
          const sanitizedNewNodes = (mutation.addedNodes || [])
            .filter((n: any) => allowedTypes.includes(n.type))
            .map((node: any) => ({
              ...node,
              data: {
                ...node.data,
                _isNew: true,
              },
            }));

          // Apply mutation
          const updatedNodes = [...existingWorkflow.nodes, ...sanitizedNewNodes];
          const updatedEdges = [...existingWorkflow.edges, ...(mutation.addedEdges || [])];

          const nodeCountAfter = updatedNodes.length;
          const nodesAdded = sanitizedNewNodes.length;

          logger.info('[generateWorkflow] 📈 Mutation complete', {
            correlationId: finalCorrelationId,
            nodeCountBefore,
            nodeCountAfter,
            nodesAdded,
            edgesAdded: mutation.addedEdges?.length || 0,
          });

          // Save mutated workflow
          workflowDoc.steps = updatedNodes;
          workflowDoc.edges = updatedEdges;
          await workflowDoc.save();

          logger.info('[generateWorkflow] 💾 Mutated workflow saved', {
            correlationId: finalCorrelationId,
            workflowId,
          });

          res.status(200).json({
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
          });
          return;
        } catch (error) {
          logger.error('[generateWorkflow] ❌ Mutation failed', {
            correlationId: finalCorrelationId,
            error: (error as Error).message,
            stack: (error as Error).stack,
          });
          // Fall through to generate new workflow
        }
      }
    }

    // Generate NEW workflow
    const finalSystem = `
${systemPrompt}

${schemaPrompt}
`.trim();

    const finalUser = userPrompt(prompt, nodeCatalog);

    logger.info('[generateWorkflow] 🤖 Calling AI for generation', {
      correlationId: finalCorrelationId,
    });

    const raw = await ai.generateWorkflow(finalUser, finalSystem);
    const cleaned = extractJson(raw);
    const repaired = repairJson(cleaned);
    const workflow = JSON.parse(repaired);

    // Sanitize nodes
    workflow.nodes = workflow.nodes
      .filter((n: any) => allowedTypes.includes(n.type))
      .map((node: any) => ({
        ...node,
        data: {
          ...node.data,
          label: node.data?.label || node.type,
        },
      }));

    logger.info('[generateWorkflow] ✅ Workflow generated', {
      correlationId: finalCorrelationId,
      nodeCount: workflow.nodes?.length || 0,
      edgeCount: workflow.edges?.length || 0,
    });

    // Save workflow if workflowId and ownerId provided
    if (workflowId && ownerId) {
      await Workflow.findOneAndUpdate(
        { workflowId, ownerId },
        {
          workflowId,
          ownerId,
          steps: workflow.nodes,
          edges: workflow.edges,
          inputVariables: workflow.inputVariables || [],
        },
        { upsert: true }
      );

      logger.info('[generateWorkflow] 💾 Workflow saved', {
        correlationId: finalCorrelationId,
        workflowId,
      });
    }

    res.status(200).json({
      nodes: workflow.nodes,
      edges: workflow.edges,
      metadata: {
        generatedAt: new Date().toISOString(),
        prompt: prompt.slice(0, 200),
        correlationId: finalCorrelationId,
        isMutation: false,
      },
    });
  } catch (error) {
    logger.error('[generateWorkflow] ❌ Error generating workflow', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    next(error);
  }
});

/**
 * POST /ai/mutate-workflow
 * Mutate existing workflow based on prompt
 * THIN WRAPPER: Routes MCP server mutations through SupervisorAgent at the top
 */
router.post('/mutate-workflow', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { prompt, workflowId, ownerId, correlationId } = req.body;
    const finalCorrelationId = correlationId || uuidv4();

    logger.info('[workflowMutation] 📥 Mutation request received', {
      correlationId: finalCorrelationId,
      workflowId,
      prompt: prompt?.slice(0, 100),
    });

    if (!prompt || !workflowId || !ownerId) {
      res.status(400).json({
        error: 'prompt, workflowId, and ownerId are required',
      });
      return;
    }

    // ═══════════════════════════════════════════════════════════════
    // SUPERVISORAGENT THIN WRAPPER - MCP SERVER MUTATIONS ONLY
    // ═══════════════════════════════════════════════════════════════
    // Check if this is an MCP server mutation (workflowId contains mcp_workflow pattern)
    const serverIdMatch = workflowId.match(/mcp_workflow_(mcp_\d+_[a-f0-9]+)_\d+/);
    
    if (serverIdMatch) {
      const serverId = serverIdMatch[1];
      const mcpServer = await MCPServer.findOne({ serverId, ownerId });
      
      if (mcpServer) {
        logger.info('[workflowMutation] 🔄 Routing MCP server mutation through SupervisorAgent', {
          correlationId: finalCorrelationId,
          serverId,
          workflowId,
        });

        // Route through SupervisorAgent - it calls existing mutateMCPServer()
        const { task, result: mutatedServer, supervisorLogs } = await supervisorAgent.handleUserIntent({
          prompt,
          workflowId,
          ownerId,
          correlationId: finalCorrelationId,
          socketServer,
          executionId: workflowId,
        });

        logger.info('[workflowMutation] ✅ MCP server mutated via SupervisorAgent', {
          correlationId: finalCorrelationId,
          taskId: task.taskId,
          serverId: mutatedServer.serverId,
          toolCount: mutatedServer.tools.length,
        });

        // Convert MCP server tools to workflow nodes for frontend compatibility
        const updatedNodes = mutatedServer.tools.map((tool: any, index: number) => ({
          id: `${tool.toolId}-${index}`,
          type: tool.toolId,
          data: {
            label: tool.name,
            fields: tool.inputSchema,
            description: tool.description,
            toolId: tool.toolId,
            inputSchema: tool.inputSchema,
            outputSchema: tool.outputSchema,
          },
        }));

        const updatedEdges = updatedNodes.slice(0, -1).map((node: any, index: number) => ({
          id: `edge-${index}`,
          source: node.id,
          target: updatedNodes[index + 1].id,
        }));

        // Update workflow document for frontend compatibility
        await Workflow.findOneAndUpdate(
          { workflowId, ownerId },
          {
            workflowId,
            ownerId,
            apiName: mutatedServer.name,
            apiPath: `/workflow/run/${workflowId}`,
            steps: updatedNodes,
            edges: updatedEdges,
            inputVariables: [],
          },
          { upsert: true }
        );

        res.status(200).json({
          workflowId,
          nodes: updatedNodes,
          edges: updatedEdges,
          diff: {
            nodesAdded: 0,
            nodeCountBefore: 0,
            nodeCountAfter: updatedNodes.length,
            newNodeIds: [],
          },
          reasoning: 'MCP server mutated successfully',
          correlationId: finalCorrelationId,
          taskId: task.taskId,
          supervisorLogs, // Include supervisor logs for frontend
        });
        return;
      }
    }
    // ═══════════════════════════════════════════════════════════════
    // END SUPERVISORAGENT WRAPPER
    // ═══════════════════════════════════════════════════════════════

    // LEGACY WORKFLOW MUTATION - Keep ALL existing logic below unchanged
    // Load existing workflow from database
    const workflowDoc = await Workflow.findOne({ workflowId, ownerId });

    if (!workflowDoc) {
      logger.warn('[workflowMutation] ⚠️ Workflow not found, creating from MCP server', {
        correlationId: finalCorrelationId,
        workflowId,
      });

      // Extract serverId from workflowId (format: mcp_workflow_{serverId}_{timestamp})
      // serverId format: mcp_{timestamp}_{hash}
      const serverIdMatch = workflowId.match(/mcp_workflow_(mcp_\d+_[a-f0-9]+)_\d+/);
      if (!serverIdMatch) {
        logger.error('[workflowMutation] ❌ Invalid workflowId format', {
          correlationId: finalCorrelationId,
          workflowId,
        });
        res.status(400).json({
          error: 'Invalid workflowId format',
        });
        return;
      }

      const serverId = serverIdMatch[1];
      logger.info('[workflowMutation] 📝 Extracted serverId', {
        correlationId: finalCorrelationId,
        workflowId,
        serverId,
      });
      const mcpServer = await MCPServer.findOne({ serverId, ownerId });

      if (!mcpServer) {
        logger.error('[workflowMutation] ❌ MCP server not found', {
          correlationId: finalCorrelationId,
          serverId,
        });
        res.status(404).json({
          error: 'MCP server not found',
        });
        return;
      }

      // Create workflow from MCP server tools
      const initialNodes = mcpServer.tools.map((tool: any, index: number) => ({
        id: `${tool.toolId}-${index}`,
        type: tool.toolId,
        data: {
          label: tool.name,
          fields: tool.inputSchema,
          description: tool.description,
          toolId: tool.toolId, // Ensure toolId is set
          inputSchema: tool.inputSchema,
          outputSchema: tool.outputSchema,
        },
      }));

      const initialEdges = initialNodes.slice(0, -1).map((node: any, index: number) => ({
        id: `edge-${index}`,
        source: node.id,
        target: initialNodes[index + 1].id,
      }));

      // Create workflow document
      const newWorkflow = await Workflow.create({
        workflowId,
        ownerId,
        apiName: mcpServer.name,
        apiPath: `/workflow/run/${workflowId}`,
        steps: initialNodes,
        edges: initialEdges,
        inputVariables: [],
      });

      logger.info('[workflowMutation] ✅ Created workflow from MCP server', {
        correlationId: finalCorrelationId,
        workflowId,
        nodeCount: initialNodes.length,
      });
    }

    // Now workflowDoc exists (either found or created)
    const finalWorkflowDoc = workflowDoc || (await Workflow.findOne({ workflowId, ownerId }))!;
    
    const existingWorkflow = {
      nodes: finalWorkflowDoc.steps || [],
      edges: finalWorkflowDoc.edges || [],
    };

    const nodeCountBefore = existingWorkflow.nodes.length;

    logger.info('[workflowMutation] 📊 Loaded existing workflow', {
      correlationId: finalCorrelationId,
      nodeCountBefore,
      existingNodes: existingWorkflow.nodes.map((n: any) => ({
        id: n.id,
        type: n.type,
        label: n.data?.label,
      })),
      existingEdges: existingWorkflow.edges.map((e: any) => ({
        id: e.id,
        source: e.source,
        target: e.target,
      })),
      hasResponseNode: existingWorkflow.nodes.some((n: any) => n.type === 'response'),
      nodeTypes: existingWorkflow.nodes.map((n: any) => n.type),
    });

    // Build mutation prompt
    const nodesSummary = existingWorkflow.nodes
      .map((n: any, idx: number) => `${idx + 1}. ID: "${n.id}", Type: ${n.type}, Label: "${n.data?.label || n.type}"`)
      .join('\n');

    const edgesSummary = existingWorkflow.edges
      .map((e: any) => `  ${e.source} → ${e.target}`)
      .join('\n');

    const mutationPrompt = `
You are modifying an EXISTING workflow. Do NOT regenerate from scratch.

EXISTING WORKFLOW:
Nodes (${existingWorkflow.nodes.length}):
${nodesSummary}

Current Edges (${existingWorkflow.edges.length}):
${edgesSummary}

USER REQUEST: ${prompt}

CRITICAL RULES:
1. Return ONLY new nodes and edges to ADD (use "addedNodes" and "addedEdges")
2. Do NOT return existing nodes or edges
3. New edges MUST connect to existing nodes using their EXACT IDs
4. Think about WHERE in the flow the new functionality belongs
5. The "response" node (if exists) will AUTOMATICALLY be moved to the end - don't worry about it

INSERTION STRATEGY:
- For JWT/auth: Add AFTER validation, connect to next node
- For email: Add AFTER main action, connect to response
- Always maintain flow continuity

EXAMPLE - Adding JWT to signup:
Existing: input_1 → validate_2 → create_3 → response_4
Add JWT between validate and create:
{
  "addedNodes": [{
    "id": "jwt_gen_5",
    "type": "jwtGenerate",
    "data": {
      "label": "Generate JWT",
      "fields": {
        "payload": { "userId": "{{created._id}}" },
        "expiresIn": "7d",
        "output": "token"
      }
    }
  }],
  "addedEdges": [
    { "id": "edge_5", "source": "validate_2", "target": "jwt_gen_5" },
    { "id": "edge_6", "source": "jwt_gen_5", "target": "create_3" }
  ],
  "reasoning": "Inserted JWT generation between validation and user creation"
}

Available node types: ${nodeCatalog.map((n) => n.type).join(', ')}
`.trim();

    const systemPromptMutation = `You are a workflow mutation assistant. You modify existing workflows by adding new nodes and edges. Return ONLY the additions using "addedNodes" and "addedEdges" keys.`;

    logger.info('[workflowMutation] 🤖 Calling AI for mutation', {
      correlationId: finalCorrelationId,
    });

    const ai = getAIProvider(process.env.AI_PROVIDER || 'groq');
    const raw = await ai.generateWorkflow(mutationPrompt, systemPromptMutation);
    const cleaned = extractJson(raw);
    const repaired = repairJson(cleaned);
    const mutation = JSON.parse(repaired);

    // Support both addedNodes/addedEdges (Motia format) and newNodes/newEdges
    const addedNodes = mutation.addedNodes || mutation.newNodes || [];
    const addedEdges = mutation.addedEdges || mutation.newEdges || [];

    logger.info('[workflowMutation] ✅ AI mutation received', {
      correlationId: finalCorrelationId,
      addedNodesCount: addedNodes.length,
      addedEdgesCount: addedEdges.length,
      reasoning: mutation.reasoning,
    });

    // Sanitize new nodes - ensure they have proper structure
    const allowedTypes = nodeCatalog.map((n) => n.type);
    const sanitizedNewNodes = addedNodes
      .filter((n: any) => allowedTypes.includes(n.type))
      .map((node: any) => ({
        ...node,
        id: node.id || `${node.type}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        data: {
          ...node.data,
          label: node.data?.label || node.type,
          toolId: node.type, // Set toolId to the node type (e.g., "jwtGenerate")
          _isNew: true, // Mark for frontend highlighting
        },
      }));

    // ═══════════════════════════════════════════════════════════════
    // DETERMINISTIC NORMALIZATION: RESPONSE NODE MUST BE LAST
    // ═══════════════════════════════════════════════════════════════

    let updatedNodes: any[];
    let updatedEdges: any[];

    // Step 1: Detect Response node
    const responseNode = existingWorkflow.nodes.find((n: any) => n.type === 'response');

    if (responseNode) {
      logger.info('[workflowMutation] 🎯 Response node detected', {
        correlationId: finalCorrelationId,
        responseNodeId: responseNode.id,
      });

      // Step 2: Remove Response node and its edges temporarily
      const nodesWithoutResponse = existingWorkflow.nodes.filter((n: any) => n.type !== 'response');
      const edgesWithoutResponse = existingWorkflow.edges.filter(
        (e: any) => e.source !== responseNode.id && e.target !== responseNode.id
      );

      // Step 3: Deduplicate nodes by ID
      const existingNodeIds = new Set([
        ...nodesWithoutResponse.map((n: any) => n.id),
        responseNode.id,
      ]);

      const trulyNewNodes = sanitizedNewNodes.filter((n: any) => {
        if (existingNodeIds.has(n.id)) {
          logger.warn('[workflowMutation] ⚠️ Duplicate node ID, skipping', {
            correlationId: finalCorrelationId,
            nodeId: n.id,
          });
          return false;
        }
        return true;
      });

      const intermediateNodes = [...nodesWithoutResponse, ...trulyNewNodes];

      // Step 4: Deduplicate edges by ID
      const existingEdgeIds = new Set(edgesWithoutResponse.map((e: any) => e.id));
      const trulyNewEdges = addedEdges
        .filter((e: any) => !existingEdgeIds.has(e.id))
        .map((e: any) => ({
          ...e,
          id: e.id || `edge_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        }));

      // Step 4.5: Remove edges that are directly replaced by new edges
      // An edge A→B is replaced if there's a new edge A→X (same source, different target)
      const edgesToRemove = new Set<string>();
      
      for (const newEdge of trulyNewEdges) {
        // Find existing edges with the same source
        for (const oldEdge of edgesWithoutResponse) {
          if (oldEdge.source === newEdge.source && oldEdge.target !== newEdge.target) {
            // Check if the new edge's target connects to the old edge's target
            // This means we're inserting a node in between
            const connectsToOldTarget = trulyNewEdges.some(
              (e: any) => e.source === newEdge.target && e.target === oldEdge.target
            );
            
            if (connectsToOldTarget) {
              edgesToRemove.add(oldEdge.id);
              logger.info('[workflowMutation] 🗑️ Removing replaced edge', {
                correlationId: finalCorrelationId,
                removedEdge: `${oldEdge.source} → ${oldEdge.target}`,
                replacedBy: `${newEdge.source} → ${newEdge.target} → ${oldEdge.target}`,
              });
            }
          }
        }
      }
      
      const edgesWithoutReplaced = edgesWithoutResponse.filter((e: any) => !edgesToRemove.has(e.id));

      const edgesBetweenNodes = [
        ...edgesWithoutReplaced,
        ...trulyNewEdges.filter((e: any) => e.target !== responseNode.id),
      ];

      // Step 5: Find terminal nodes (nodes with no outgoing edges)
      const nodesWithOutgoingEdges = new Set(edgesBetweenNodes.map((e: any) => e.source));
      const terminalNodes = intermediateNodes.filter((n: any) => !nodesWithOutgoingEdges.has(n.id));

      logger.info('[workflowMutation] 🎯 Terminal nodes identified', {
        correlationId: finalCorrelationId,
        terminalNodeCount: terminalNodes.length,
        terminalNodeIds: terminalNodes.map((n: any) => n.id),
      });

      // Step 6: Connect all terminal nodes to Response
      const edgesToResponse = terminalNodes.map((n: any) => ({
        id: `edge_to_response_${n.id}`,
        source: n.id,
        target: responseNode.id,
      }));

      // Remove duplicate edges to Response (keep only one per source)
      const uniqueEdgesToResponse = Array.from(
        new Map(edgesToResponse.map((e) => [e.source, e])).values()
      );

      // Step 7: Build final graph with Response as last node
      updatedNodes = [...intermediateNodes, responseNode];
      updatedEdges = [...edgesBetweenNodes, ...uniqueEdgesToResponse];

      logger.info('[workflowMutation] ✅ Response node reinserted as last', {
        correlationId: finalCorrelationId,
        finalNodeCount: updatedNodes.length,
        finalEdgeCount: updatedEdges.length,
        edgesToResponse: uniqueEdgesToResponse.length,
      });
    } else {
      // No response node - simple append
      const existingNodeIds = new Set(existingWorkflow.nodes.map((n: any) => n.id));
      const trulyNewNodes = sanitizedNewNodes.filter((n: any) => !existingNodeIds.has(n.id));

      const existingEdgeIds = new Set(existingWorkflow.edges.map((e: any) => e.id));
      const trulyNewEdges = addedEdges
        .filter((e: any) => !existingEdgeIds.has(e.id))
        .map((e: any) => ({
          ...e,
          id: e.id || `edge_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        }));

      updatedNodes = [...existingWorkflow.nodes, ...trulyNewNodes];
      updatedEdges = [...existingWorkflow.edges, ...trulyNewEdges];

      logger.info('[workflowMutation] ✅ Mutation applied (no response node)', {
        correlationId: finalCorrelationId,
        nodesAdded: trulyNewNodes.length,
        edgesAdded: trulyNewEdges.length,
      });
    }

    const nodeCountAfter = updatedNodes.length;
    const nodesAdded = nodeCountAfter - nodeCountBefore;

    logger.info('[workflowMutation] 📈 Mutation complete', {
      correlationId: finalCorrelationId,
      nodeCountBefore,
      nodeCountAfter,
      nodesAdded,
      edgesAdded: addedEdges.length,
    });

    // Save mutated workflow to workflows collection (for tracking)
    finalWorkflowDoc.steps = updatedNodes;
    finalWorkflowDoc.edges = updatedEdges;
    await finalWorkflowDoc.save();

    logger.info('[workflowMutation] 💾 Mutated workflow saved to workflows collection', {
      correlationId: finalCorrelationId,
      workflowId,
    });

    // ALSO update the MCP server directly so changes persist on reload
    // Extract serverId from workflowId (format: mcp_workflow_{serverId}_{timestamp})
    // serverId format: mcp_{timestamp}_{hash}
    const serverIdMatchLegacy = workflowId.match(/mcp_workflow_(mcp_\d+_[a-f0-9]+)_\d+/);
    if (serverIdMatchLegacy) {
      const serverId = serverIdMatchLegacy[1];
      
      logger.info('[workflowMutation] 📝 Updating MCP server', {
        correlationId: finalCorrelationId,
        workflowId,
        serverId,
      });
      
      try {
        const mcpServer = await MCPServer.findOne({ serverId, ownerId });
        
        if (mcpServer) {
          // Convert nodes to MCP tools format
          const updatedTools = updatedNodes.map((node: any) => {
            // Use the original toolId from node data, or derive from node type
            const toolId = node.data?.toolId || node.type;
            
            // Prefer inputSchema if it exists, otherwise use fields directly
            // This ensures consistency: fields are stored at the top level of inputSchema
            let inputSchema = {};
            if (node.data?.inputSchema) {
              inputSchema = node.data.inputSchema;
            } else if (node.data?.fields) {
              // Flatten fields to top level (not nested under 'fields' key)
              inputSchema = { ...node.data.fields };
            }
            
            return {
              toolId: toolId,
              name: node.data?.label || node.type,
              description: node.data?.description || `${node.type} operation`,
              inputSchema: inputSchema,
              outputSchema: node.data?.outputSchema || {},
            };
          });

          // Update execution order using proper toolIds
          const executionOrder = updatedNodes.map((node: any) => node.data?.toolId || node.type);

          mcpServer.tools = updatedTools;
          mcpServer.executionOrder = executionOrder;
          await mcpServer.save();

          logger.info('[workflowMutation] 💾 MCP server updated', {
            correlationId: finalCorrelationId,
            serverId,
            toolsCount: updatedTools.length,
            tools: updatedTools.map(t => ({ toolId: t.toolId, name: t.name })),
          });
        }
      } catch (mcpError) {
        logger.warn('[workflowMutation] ⚠️ Failed to update MCP server', {
          correlationId: finalCorrelationId,
          error: (mcpError as Error).message,
        });
      }
    }

    res.status(200).json({
      workflowId,
      nodes: updatedNodes,
      edges: updatedEdges,
      diff: {
        nodesAdded,
        nodeCountBefore,
        nodeCountAfter,
        newNodeIds: sanitizedNewNodes.map((n: any) => n.id),
      },
      reasoning: mutation.reasoning,
      correlationId: finalCorrelationId,
    });
  } catch (error) {
    logger.error('[workflowMutation] ❌ Mutation failed', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    next(error);
  }
});

/**
 * POST /ai/explain-workflow
 * Explain workflow in natural language
 */
router.post('/explain-workflow', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { workflowId, ownerId, correlationId } = req.body;
    const finalCorrelationId = correlationId || `explain-${Date.now()}`;

    logger.info('[explainWorkflow] 📥 Explain request received', {
      correlationId: finalCorrelationId,
      workflowId,
      ownerId,
    });

    if (!workflowId || !ownerId) {
      res.status(400).json({
        error: 'workflowId and ownerId are required',
      });
      return;
    }

    // Load workflow
    const workflowDoc = await Workflow.findOne({ workflowId, ownerId });

    if (!workflowDoc) {
      logger.error('[explainWorkflow] ❌ Workflow not found', {
        correlationId: finalCorrelationId,
        workflowId,
      });
      res.status(404).json({
        error: 'Workflow not found',
      });
      return;
    }

    const nodes = workflowDoc.steps || [];
    const nodeCount = nodes.length;

    logger.info('[explainWorkflow] 📊 Workflow loaded', {
      correlationId: finalCorrelationId,
      nodeCount,
      nodeTypes: nodes.map((n: any) => n.type),
    });

    // Generate explanation
    const steps = nodes.map((node: any, index: number) => {
      const type = node.type;
      const label = node.data?.label || type;
      const fields = node.data?.fields || {};

      let description = '';
      let icon = 'circle';

      switch (type) {
        case 'input':
          description = 'User provides input data to start the workflow';
          icon = 'user';
          break;
        case 'inputValidation':
          description = 'Input data is validated to ensure it meets requirements';
          icon = 'shield-check';
          break;
        case 'authMiddleware':
          description = 'User authentication is verified using JWT tokens';
          icon = 'lock';
          break;
        case 'dbFind':
          const findCollection = fields.collection || 'database';
          description = `Search for existing records in ${findCollection}`;
          icon = 'search';
          break;
        case 'dbInsert':
          const insertCollection = fields.collection || 'database';
          description = `Create new record in ${insertCollection} collection`;
          icon = 'database';
          break;
        case 'dbUpdate':
          const updateCollection = fields.collection || 'database';
          description = `Update existing record in ${updateCollection} collection`;
          icon = 'edit';
          break;
        case 'emailSend':
          description = 'Send email notification to user';
          icon = 'mail';
          break;
        case 'response':
          description = 'Send response back to the user';
          icon = 'send';
          break;
        default:
          description = `Execute ${type} operation`;
          icon = 'zap';
      }

      return {
        order: index + 1,
        type,
        label,
        description,
        icon,
      };
    });

    // Generate data flow
    const dataFlow: string[] = [];
    const hasInput = nodes.some((n: any) => n.type === 'input');
    const hasValidation = nodes.some((n: any) => n.type === 'inputValidation');
    const hasAuth = nodes.some((n: any) => n.type === 'authMiddleware');
    const hasDbWrite = nodes.some((n: any) => ['dbInsert', 'dbUpdate'].includes(n.type));
    const hasDbRead = nodes.some((n: any) => n.type === 'dbFind');
    const hasEmail = nodes.some((n: any) => n.type === 'emailSend');

    if (hasInput) dataFlow.push('User input is received');
    if (hasValidation) dataFlow.push('Input is validated for correctness');
    if (hasAuth) dataFlow.push('User authentication is verified');
    if (hasDbRead) dataFlow.push('Data is retrieved from database');
    if (hasDbWrite) dataFlow.push('Data is stored in database');
    if (hasEmail) dataFlow.push('Email notification is sent');
    dataFlow.push('Response is returned to user');

    // Generate security notes
    const securityNotes: any[] = [];
    if (hasAuth) {
      securityNotes.push({
        type: 'authentication',
        message: 'JWT authentication is enabled for secure access',
        severity: 'success',
      });
    }
    if (hasValidation) {
      securityNotes.push({
        type: 'validation',
        message: 'Input validation is active to prevent invalid data',
        severity: 'success',
      });
    }

    // Generate summary
    let summary = 'This workflow ';
    if (hasAuth) summary += 'authenticates users, ';
    if (hasDbWrite || hasDbRead) summary += 'manages data in the database, ';
    if (hasEmail) summary += 'sends email notifications, ';
    summary += `and processes requests through ${nodes.length} steps.`;

    const response = {
      workflowId,
      summary,
      steps,
      dataFlow,
      securityNotes,
      nodeCount,
      correlationId: finalCorrelationId,
    };

    logger.info('[explainWorkflow] ✅ Explanation generated', {
      correlationId: finalCorrelationId,
      stepCount: steps.length,
      securityNoteCount: securityNotes.length,
    });

    res.status(200).json(response);
  } catch (error) {
    logger.error('[explainWorkflow] ❌ Explanation failed', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    next(error);
  }
});

  return router;
}

export default initAIRoutes;
