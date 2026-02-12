/**
 * MCP Server Generator
 * Converts workflow generation logic to MCP server generation
 * Transforms workflow nodes into MCP tools
 */

import { v4 as uuidv4 } from "uuid";
import { MCPServer, MCPTool, MCPResource } from "./schemas";
import { getAIProvider } from "../ai/providers";
import { nodeCatalog } from "../ai/nodeCatalog";
import { extractJson } from "../utils/extractJson";
import { repairJson } from "../utils/repairJson";
import { systemPrompt } from "../ai/prompts/systemPrompt";
import { schemaPrompt } from "../ai/prompts/schemaPrompt";
import { userPrompt } from "../ai/prompts/userPrompt";
import { logger } from "../utils/logger";

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

interface WorkflowDefinition {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

/**
 * Convert workflow node to MCP tool definition
 */
function nodeToTool(node: WorkflowNode): Omit<MCPTool, "handler"> {
  const { id, type, data } = node;
  const fields = data.fields || {};

  // CRITICAL: Use node TYPE as toolId, not node ID
  // This ensures tools match the registry (input, dbInsert, etc.)
  const toolId = type;

  // Map node type to tool schema
  const toolSchemas: Record<string, any> = {
    input: {
      inputSchema: {
        type: "object",
        properties: {
          variables: {
            type: "array",
            items: { type: "object" },
          },
        },
        required: ["variables"],
      },
    },
    inputValidation: {
      inputSchema: {
        type: "object",
        properties: {
          rules: {
            type: "array",
            items: { type: "object" },
          },
        },
        required: ["rules"],
      },
    },
    dbFind: {
      inputSchema: {
        type: "object",
        properties: {
          collection: { type: "string" },
          findType: { type: "string" },
          filters: { type: "object" },
          output: { type: "string" },
        },
        required: ["collection", "filters"],
      },
    },
    dbInsert: {
      inputSchema: {
        type: "object",
        properties: {
          collection: { type: "string" },
          data: { type: "object" },
          output: { type: "string" },
        },
        required: ["collection", "data"],
      },
    },
    dbUpdate: {
      inputSchema: {
        type: "object",
        properties: {
          collection: { type: "string" },
          filter: { type: "object" },
          data: { type: "object" },
          output: { type: "string" },
        },
        required: ["collection", "filter", "data"],
      },
    },
    authMiddleware: {
      inputSchema: {
        type: "object",
        properties: {
          output: { type: "string" },
        },
      },
    },
    jwtGenerate: {
      inputSchema: {
        type: "object",
        properties: {
          payload: { type: "object" },
          expiresIn: { type: "string" },
          algorithm: { type: "string" },
          output: { type: "string" },
        },
        required: ["payload"],
      },
    },
    emailSend: {
      inputSchema: {
        type: "object",
        properties: {
          to: { type: "string" },
          subject: { type: "string" },
          body: { type: "string" },
        },
        required: ["to", "subject", "body"],
      },
    },
    response: {
      inputSchema: {
        type: "object",
        properties: {
          status: { type: "number" },
          body: { type: "object" },
        },
      },
    },
  };

  const schema = toolSchemas[type] || {
    inputSchema: {
      type: "object",
      properties: {},
    },
  };

  return {
    toolId: toolId, // Use type as toolId (input, dbInsert, etc.)
    name: data.label || type,
    description: `${type} operation`,
    inputSchema: schema.inputSchema,
    outputSchema: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        data: { type: "object" },
      },
    },
  };
}

/**
 * Extract resources from workflow nodes
 */
function extractResources(nodes: WorkflowNode[]): MCPResource[] {
  const resources: MCPResource[] = [];
  const collections = new Set<string>();

  for (const node of nodes) {
    const fields = node.data.fields || {};

    // Extract database collections
    if (
      ["dbFind", "dbInsert", "dbUpdate", "dbDelete"].includes(node.type) &&
      fields.collection
    ) {
      collections.add(fields.collection);
    }

    // Extract email resource
    if (node.type === "emailSend") {
      resources.push({
        resourceId: "email_service",
        name: "Email Service",
        type: "email",
        config: {
          provider: "smtp",
        },
      });
    }

    // Extract auth resource
    if (node.type === "authMiddleware" || node.type === "jwtGenerate") {
      resources.push({
        resourceId: "auth_service",
        name: "Authentication Service",
        type: "auth",
        config: {
          jwtSecret: process.env.JWT_SECRET || "{{env.JWT_SECRET}}",
        },
      });
    }
  }

  // Add database resources
  for (const collection of collections) {
    resources.push({
      resourceId: `db_${collection}`,
      name: `Database: ${collection}`,
      type: "database",
      config: {
        collection,
        provider: "mongodb",
      },
    });
  }

  return resources;
}

/**
 * Generate MCP server from user prompt
 */
export async function generateMCPServer(
  prompt: string,
  ownerId?: string,
  correlationId?: string
): Promise<MCPServer> {
  const finalCorrelationId = correlationId || `mcp-gen-${Date.now()}`;

  logger.info("[generateMCPServer] Starting MCP server generation", {
    correlationId: finalCorrelationId,
    prompt: prompt.slice(0, 100),
  });

  // Use existing AI workflow generation logic
  const ai = getAIProvider(process.env.AI_PROVIDER || "groq");
  const finalSystem = `
${systemPrompt}

${schemaPrompt}
`.trim();

  const finalUser = userPrompt(prompt, nodeCatalog);

  logger.info("[generateMCPServer] Calling AI provider", {
    correlationId: finalCorrelationId,
  });

  const raw = await ai.generateWorkflow(finalUser, finalSystem);
  const cleaned = extractJson(raw);
  const repaired = repairJson(cleaned);
  const workflow: WorkflowDefinition = JSON.parse(repaired);

  logger.info("[generateMCPServer] Workflow generated", {
    correlationId: finalCorrelationId,
    nodeCount: workflow.nodes?.length || 0,
    edgeCount: workflow.edges?.length || 0,
  });

  // Convert workflow to MCP server
  const serverId = `mcp_${Date.now()}_${uuidv4().slice(0, 8)}`;
  const serverName = extractServerName(prompt);
  
  // Convert nodes to tools and deduplicate by toolId (type)
  const allTools = workflow.nodes.map(nodeToTool);
  const toolMap = new Map<string, Omit<MCPTool, "handler">>();
  
  // Deduplicate tools by toolId (keep first occurrence)
  for (const tool of allTools) {
    if (!toolMap.has(tool.toolId)) {
      toolMap.set(tool.toolId, tool);
    }
  }
  
  const tools = Array.from(toolMap.values());
  const resources = extractResources(workflow.nodes);

  const mcpServer: MCPServer = {
    serverId,
    name: serverName,
    description: `MCP server generated from: ${prompt.slice(0, 100)}`,
    tools,
    resources,
    agents: [], // No agents initially
    permissions: [], // No permissions initially
    status: "created",
    createdAt: new Date(),
    ownerId,
  };

  logger.info("[generateMCPServer] MCP server generated", {
    correlationId: finalCorrelationId,
    serverId,
    toolCount: tools.length,
    resourceCount: resources.length,
    deduplicatedFrom: allTools.length,
  });

  return mcpServer;
}

/**
 * Extract server name from prompt
 */
function extractServerName(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase();

  // Try to extract API name
  const apiMatch = prompt.match(/(?:create|build|make)\s+(?:a|an)?\s*(\w+)\s+(?:api|endpoint|server)/i);
  if (apiMatch) {
    return `${capitalize(apiMatch[1])} API`;
  }

  // Try to extract workflow name
  const workflowMatch = prompt.match(/(?:create|build|make)\s+(?:a|an)?\s*(\w+)\s+(?:workflow|flow)/i);
  if (workflowMatch) {
    return `${capitalize(workflowMatch[1])} Server`;
  }

  // Default naming
  if (lowerPrompt.includes("signup") || lowerPrompt.includes("register")) {
    return "User Registration API";
  }
  if (lowerPrompt.includes("login") || lowerPrompt.includes("auth")) {
    return "Authentication API";
  }
  if (lowerPrompt.includes("user")) {
    return "User Management API";
  }

  return "Generated MCP Server";
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Mutate existing MCP server based on prompt
 */
export async function mutateMCPServer(
  existingServer: MCPServer,
  prompt: string,
  correlationId?: string
): Promise<MCPServer> {
  const finalCorrelationId = correlationId || `mcp-mut-${Date.now()}`;

  logger.info("[mutateMCPServer] Starting MCP server mutation", {
    correlationId: finalCorrelationId,
    serverId: existingServer.serverId,
    prompt: prompt.slice(0, 100),
  });

  // Convert existing tools back to workflow nodes for AI context
  const existingNodes: WorkflowNode[] = existingServer.tools.map((tool) => ({
    id: tool.toolId,
    type: tool.toolId.split("_")[0] || "unknown", // Extract type from toolId
    data: {
      label: tool.name,
      fields: {},
    },
  }));

  const nodesSummary = existingNodes
    .map((n, idx) => `${idx + 1}. ID: ${n.id}, Type: ${n.type}, Label: ${n.data.label}`)
    .join("\n");

  const mutationPrompt = `
You are modifying an EXISTING MCP server. Do NOT create a separate server.

EXISTING TOOLS (${existingNodes.length}):
${nodesSummary}

USER REQUEST: ${prompt}

CRITICAL INSTRUCTIONS:
1. ANALYZE the existing tools to understand the server's functionality
2. IDENTIFY where new tools should be added
3. DO NOT duplicate existing functionality
4. ADD ONLY the minimal new tools needed
5. Return ONLY the new tools to add

Return a JSON object with:
{
  "addedNodes": [array of new workflow nodes to add],
  "reasoning": "brief explanation of changes"
}

Available node types: ${nodeCatalog.map((n) => n.type).join(", ")}
`.trim();

  const systemPromptMutation = `
${systemPrompt}

${schemaPrompt}

CRITICAL: You are MODIFYING an existing MCP server, NOT creating a new one.
Return ONLY new nodes to ADD.
`.trim();

  const ai = getAIProvider(process.env.AI_PROVIDER || "groq");
  const raw = await ai.generateWorkflow(mutationPrompt, systemPromptMutation);
  const cleaned = extractJson(raw);
  const repaired = repairJson(cleaned);
  const mutation = JSON.parse(repaired);

  logger.info("[mutateMCPServer] AI mutation received", {
    correlationId: finalCorrelationId,
    addedNodesCount: mutation.addedNodes?.length || 0,
  });

  // Convert new nodes to tools
  const newTools = (mutation.addedNodes || []).map(nodeToTool);
  const newResources = extractResources(mutation.addedNodes || []);

  // Merge with existing server
  const mutatedServer: MCPServer = {
    ...existingServer,
    tools: [...existingServer.tools, ...newTools],
    resources: [...existingServer.resources, ...newResources],
    updatedAt: new Date(),
  };

  logger.info("[mutateMCPServer] MCP server mutated", {
    correlationId: finalCorrelationId,
    serverId: mutatedServer.serverId,
    toolCountBefore: existingServer.tools.length,
    toolCountAfter: mutatedServer.tools.length,
    toolsAdded: newTools.length,
  });

  return mutatedServer;
}
