/**
 * Agent Service
 * Business logic for agent management
 */

import { v4 as uuidv4 } from "uuid";
import MCPAgent from "../models/mcpAgent.model";
import MCPServer from "../models/mcpServer.model";
import { runtimeManager } from "../mcp/runtime.manager";
import { MCPAgent as MCPAgentType } from "../mcp/schemas";
import { logger } from "../utils/logger";

export interface CreateAgentInput {
  name: string;
  description?: string;
  allowedTools: string[];
  ownerId: string;
}

export interface UpdatePermissionsInput {
  allowedTools: string[];
}

export class InvalidPermissionAssignmentError extends Error {
  constructor(
    public agentId: string,
    public invalidTools: string[],
    public serverId?: string
  ) {
    super(
      `Cannot assign tools [${invalidTools.join(", ")}] to agent ${agentId}${
        serverId ? ` for server ${serverId}` : ""
      }: tools not found in server definition`
    );
    this.name = "InvalidPermissionAssignmentError";
  }
}

/**
 * Create a new agent
 */
export async function createAgent(input: CreateAgentInput): Promise<MCPAgentType> {
  const agentId = `agent_${Date.now()}_${uuidv4().slice(0, 8)}`;

  const agent = await MCPAgent.create({
    agentId,
    name: input.name,
    description: input.description || "",
    allowedTools: input.allowedTools,
    attachedServers: [],
    ownerId: input.ownerId,
  });

  logger.info("Agent created", {
    agentId,
    name: input.name,
    ownerId: input.ownerId,
  });

  return {
    agentId: agent.agentId,
    name: agent.name,
    description: agent.description,
    allowedTools: agent.allowedTools,
    serverId: undefined,
    createdAt: agent.createdAt,
  };
}

/**
 * Get agent by ID
 */
export async function getAgent(agentId: string, ownerId: string): Promise<MCPAgentType | null> {
  const agent = await MCPAgent.findOne({ agentId, ownerId });

  if (!agent) {
    return null;
  }

  return {
    agentId: agent.agentId,
    name: agent.name,
    description: agent.description,
    allowedTools: agent.allowedTools,
    serverId: agent.attachedServers[0], // Return first attached server
    createdAt: agent.createdAt,
  };
}

/**
 * List all agents for an owner
 */
export async function listAgents(ownerId: string): Promise<MCPAgentType[]> {
  const agents = await MCPAgent.find({ ownerId }).sort({ createdAt: -1 });

  return agents.map((agent) => ({
    agentId: agent.agentId,
    name: agent.name,
    description: agent.description,
    allowedTools: agent.allowedTools,
    serverId: agent.attachedServers[0],
    createdAt: agent.createdAt,
  }));
}

/**
 * Update agent permissions
 * Validates that all tools exist in attached servers
 */
export async function updateAgentPermissions(
  agentId: string,
  ownerId: string,
  input: UpdatePermissionsInput
): Promise<MCPAgentType | null> {
  const agent = await MCPAgent.findOne({ agentId, ownerId });

  if (!agent) {
    return null;
  }

  // Validate tools exist in all attached servers
  if (agent.attachedServers.length > 0) {
    for (const serverId of agent.attachedServers) {
      const server = await MCPServer.findOne({ serverId, ownerId });
      if (server) {
        const serverToolIds = server.tools.map((t: any) => t.toolId);
        const invalidTools = input.allowedTools.filter(
          (toolId) => !serverToolIds.includes(toolId)
        );

        if (invalidTools.length > 0) {
          throw new InvalidPermissionAssignmentError(
            agentId,
            invalidTools,
            serverId
          );
        }
      }
    }
  }

  // Update agent
  agent.allowedTools = input.allowedTools;
  await agent.save();

  // Sync permissions with attached runtimes
  for (const serverId of agent.attachedServers) {
    const runtime = runtimeManager.getRuntime(serverId);
    if (runtime) {
      // Find and update agent in runtime
      const runtimeAgent = runtime.agents.find((a) => a.agentId === agentId);
      if (runtimeAgent) {
        runtimeAgent.allowedTools = input.allowedTools;
        logger.info("Agent permissions synced with runtime", {
          agentId,
          serverId,
        });
      }
    }
  }

  logger.info("Agent permissions updated", {
    agentId,
    allowedTools: input.allowedTools,
  });

  return {
    agentId: agent.agentId,
    name: agent.name,
    description: agent.description,
    allowedTools: agent.allowedTools,
    serverId: agent.attachedServers[0],
    createdAt: agent.createdAt,
  };
}

/**
 * Attach agent to MCP server
 * Validates that agent's allowed tools exist in server
 */
export async function attachAgentToServer(
  agentId: string,
  serverId: string,
  ownerId: string
): Promise<boolean> {
  // Verify agent exists
  const agent = await MCPAgent.findOne({ agentId, ownerId });
  if (!agent) {
    throw new Error(`Agent ${agentId} not found`);
  }

  // Verify server exists
  const server = await MCPServer.findOne({ serverId, ownerId });
  if (!server) {
    throw new Error(`Server ${serverId} not found`);
  }

  // Validate that all agent's allowed tools exist in server
  const serverToolIds = server.tools.map((t: any) => t.toolId);
  const invalidTools = agent.allowedTools.filter(
    (toolId) => !serverToolIds.includes(toolId)
  );

  if (invalidTools.length > 0) {
    throw new InvalidPermissionAssignmentError(agentId, invalidTools, serverId);
  }

  // Check if already attached
  if (agent.attachedServers.includes(serverId)) {
    logger.warn("Agent already attached to server", { agentId, serverId });
    return false;
  }

  // Add server to agent's attached servers
  agent.attachedServers.push(serverId);
  await agent.save();

  // Attach to runtime if it exists
  const runtime = runtimeManager.getRuntime(serverId);
  if (runtime) {
    const mcpAgent: MCPAgentType = {
      agentId: agent.agentId,
      name: agent.name,
      description: agent.description,
      allowedTools: agent.allowedTools,
      serverId,
      createdAt: agent.createdAt,
    };

    runtimeManager.attachAgent(serverId, mcpAgent);
  }

  logger.info("Agent attached to server", { agentId, serverId });

  return true;
}

/**
 * Detach agent from MCP server
 */
export async function detachAgentFromServer(
  agentId: string,
  serverId: string,
  ownerId: string
): Promise<boolean> {
  // Verify agent exists
  const agent = await MCPAgent.findOne({ agentId, ownerId });
  if (!agent) {
    throw new Error(`Agent ${agentId} not found`);
  }

  // Check if attached
  const index = agent.attachedServers.indexOf(serverId);
  if (index === -1) {
    logger.warn("Agent not attached to server", { agentId, serverId });
    return false;
  }

  // Remove server from agent's attached servers
  agent.attachedServers.splice(index, 1);
  await agent.save();

  // Detach from runtime if it exists
  const runtime = runtimeManager.getRuntime(serverId);
  if (runtime) {
    const agentIndex = runtime.agents.findIndex((a) => a.agentId === agentId);
    if (agentIndex !== -1) {
      runtime.agents.splice(agentIndex, 1);
    }
  }

  logger.info("Agent detached from server", { agentId, serverId });

  return true;
}

/**
 * Delete agent
 */
export async function deleteAgent(agentId: string, ownerId: string): Promise<boolean> {
  const agent = await MCPAgent.findOne({ agentId, ownerId });
  if (!agent) {
    return false;
  }

  // Detach from all servers
  for (const serverId of agent.attachedServers) {
    await detachAgentFromServer(agentId, serverId, ownerId);
  }

  // Delete agent
  await MCPAgent.deleteOne({ agentId, ownerId });

  logger.info("Agent deleted", { agentId });

  return true;
}
