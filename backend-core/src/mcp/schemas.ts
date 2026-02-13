/**
 * MCP Server Generator – Core Schemas
 * Defines MCP primitives that replace workflow concepts
 */

export interface MCPToolSchema {
  type: "object";
  properties: Record<string, any>;
  required?: string[];
}

export interface MCPTool {
  toolId: string;
  name: string;
  description: string;
  inputSchema: MCPToolSchema;
  outputSchema: MCPToolSchema; // Now required
  handler: (input: any, context: any) => Promise<any>;
}

/**
 * Infer basic schema from tool if missing
 */
export function inferToolSchema(tool: Partial<MCPTool>): MCPTool {
  const inputSchema = tool.inputSchema || {
    type: "object" as const,
    properties: {},
    required: [],
  };

  const outputSchema = tool.outputSchema || {
    type: "object" as const,
    properties: {
      success: { type: "boolean", description: "Operation success status" },
      data: { type: "object", description: "Result data" },
    },
  };

  return {
    ...tool,
    inputSchema,
    outputSchema,
  } as MCPTool;
}

export interface MCPResource {
  resourceId: string;
  name: string;
  type: string; // "database", "email", "auth", etc.
  config: Record<string, any>;
}

export interface MCPAgent {
  agentId: string;
  name: string;
  description?: string;
  allowedTools: string[]; // Tool IDs this agent can access
  serverId?: string; // Server this agent is attached to
  createdAt: Date;
}

export class PermissionDeniedError extends Error {
  constructor(
    public agentId: string,
    public toolId: string,
    public serverId: string
  ) {
    super(`Agent ${agentId} is not authorized to use tool ${toolId} on server ${serverId}`);
    this.name = "PermissionDeniedError";
  }
}

export interface MCPPermission {
  permissionId: string;
  agentId: string;
  toolId: string;
  granted: boolean;
  grantedAt: Date;
}

export interface MCPServer {
  serverId: string;
  name: string;
  description: string;
  tools: MCPTool[];
  resources: MCPResource[];
  agents: MCPAgent[];
  permissions: MCPPermission[];
  executionOrder?: string[]; // Ordered list of toolIds for one-click execution
  status: "created" | "running" | "stopped" | "error";
  createdAt: Date;
  updatedAt?: Date;
  ownerId?: string;
}

export interface MCPServerDefinition {
  serverId: string;
  name: string;
  description: string;
  tools: Omit<MCPTool, "handler">[]; // Serializable definition without handler
  resources: MCPResource[];
  agents: MCPAgent[];
  permissions: MCPPermission[];
  ownerId?: string;
}

export interface MCPToolInvocation {
  invocationId: string;
  serverId: string;
  toolId: string;
  agentId?: string;
  input: any;
  output?: any;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
  durationMs?: number;
}
