/**
 * MCP Server Generator – Core Schemas
 * Defines MCP primitives that replace workflow concepts
 */

export interface MCPTool {
  toolId: string;
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
  outputSchema?: {
    type: "object";
    properties: Record<string, any>;
  };
  handler: (input: any, context: any) => Promise<any>;
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
