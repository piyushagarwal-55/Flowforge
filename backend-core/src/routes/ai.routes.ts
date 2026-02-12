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

// Register built-in MCP tools on startup
registerBuiltInTools();

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
 */
router.post('/generate-mcp-server', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { prompt, ownerId, correlationId } = req.body;
    const finalCorrelationId = correlationId || `mcp-${Date.now()}`;

    logger.info('[generateMCPServer] 📥 Request received', {
      correlationId: finalCorrelationId,
      prompt: prompt?.slice(0, 100),
      ownerId,
    });

    if (!prompt) {
      res.status(400).json({
        error: 'Prompt required',
      });
      return;
    }

    // Generate MCP server
    const mcpServer = await generateMCPServer(prompt, ownerId, finalCorrelationId);

    // Save to database
    await MCPServer.create({
      serverId: mcpServer.serverId,
      name: mcpServer.name,
      description: mcpServer.description,
      tools: mcpServer.tools,
      resources: mcpServer.resources,
      agents: mcpServer.agents,
      permissions: mcpServer.permissions,
      status: mcpServer.status,
      ownerId: mcpServer.ownerId,
    });

    // Create runtime
    runtimeManager.createRuntime(mcpServer);

    logger.info('[generateMCPServer] ✅ MCP server created', {
      correlationId: finalCorrelationId,
      serverId: mcpServer.serverId,
      toolCount: mcpServer.tools.length,
    });

    res.status(200).json({
      serverId: mcpServer.serverId,
      name: mcpServer.name,
      description: mcpServer.description,
      tools: mcpServer.tools,
      resources: mcpServer.resources,
      status: mcpServer.status,
      metadata: {
        generatedAt: mcpServer.createdAt.toISOString(),
        prompt: prompt.slice(0, 200),
        correlationId: finalCorrelationId,
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

    // Load existing workflow
    const workflowDoc = await Workflow.findOne({ workflowId, ownerId });

    if (!workflowDoc) {
      logger.error('[workflowMutation] ❌ Workflow not found', {
        correlationId: finalCorrelationId,
        workflowId,
      });
      res.status(404).json({
        error: 'Workflow not found',
      });
      return;
    }

    const existingWorkflow = {
      nodes: workflowDoc.steps || [],
      edges: workflowDoc.edges || [],
    };

    const nodeCountBefore = existingWorkflow.nodes.length;

    logger.info('[workflowMutation] 📊 Loaded existing workflow', {
      correlationId: finalCorrelationId,
      nodeCountBefore,
    });

    // Build mutation prompt
    const nodesSummary = existingWorkflow.nodes
      .map((n: any, idx: number) => `${idx + 1}. ${n.type} (${n.data?.label || n.type})`)
      .join('\n');

    const mutationPrompt = `
You are modifying an EXISTING workflow. Do NOT regenerate from scratch.

EXISTING WORKFLOW:
Nodes (${existingWorkflow.nodes.length}):
${nodesSummary}

USER REQUEST: ${prompt}

INSTRUCTIONS:
1. Keep ALL existing nodes unless explicitly asked to remove them
2. Add ONLY the new nodes needed for the user's request
3. Update edges to connect new nodes to existing workflow
4. Preserve the existing workflow structure

Return a JSON object with:
{
  "newNodes": [array of new nodes to add],
  "newEdges": [array of new edges to add],
  "reasoning": "brief explanation of changes"
}

Available node types: ${nodeCatalog.map((n) => n.type).join(', ')}
`.trim();

    const systemPromptMutation = `You are a workflow mutation assistant. You modify existing workflows by adding new nodes and edges. Never regenerate the entire workflow.`;

    logger.info('[workflowMutation] 🤖 Calling AI for mutation', {
      correlationId: finalCorrelationId,
    });

    const ai = getAIProvider(process.env.AI_PROVIDER || 'groq');
    const raw = await ai.generateWorkflow(mutationPrompt, systemPromptMutation);
    const cleaned = extractJson(raw);
    const repaired = repairJson(cleaned);
    const mutation = JSON.parse(repaired);

    logger.info('[workflowMutation] ✅ AI mutation received', {
      correlationId: finalCorrelationId,
      newNodesCount: mutation.newNodes?.length || 0,
      newEdgesCount: mutation.newEdges?.length || 0,
      reasoning: mutation.reasoning,
    });

    // Apply mutation
    const newNodes = mutation.newNodes || [];
    const newEdges = mutation.newEdges || [];

    const updatedNodes = [
      ...existingWorkflow.nodes,
      ...newNodes.map((node: any) => ({
        ...node,
        id: node.id || `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        data: {
          ...node.data,
          _isNew: true,
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

    logger.info('[workflowMutation] 📈 Mutation applied', {
      correlationId: finalCorrelationId,
      nodeCountBefore,
      nodeCountAfter,
      nodesAdded,
      edgesAdded: newEdges.length,
    });

    // Save mutated workflow
    workflowDoc.steps = updatedNodes;
    workflowDoc.edges = updatedEdges;
    await workflowDoc.save();

    logger.info('[workflowMutation] 💾 Mutated workflow saved', {
      correlationId: finalCorrelationId,
      workflowId,
    });

    res.status(200).json({
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

export default router;
