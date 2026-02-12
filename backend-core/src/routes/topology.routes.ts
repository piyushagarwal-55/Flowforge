/**
 * Topology Routes
 * REST API for MCP orchestration topology visualization
 */

import { Router, Request, Response, NextFunction } from "express";
import MCPServer from "../models/mcpServer.model";
import MCPAgent from "../models/mcpAgent.model";
import { runtimeManager } from "../mcp/runtime.manager";
import { logger } from "../utils/logger";

const router = Router();

interface TopologyNode {
  id: string;
  type: "server" | "agent" | "tool";
  name: string;
  status?: string;
  metadata?: Record<string, any>;
}

interface TopologyEdge {
  id: string;
  source: string;
  target: string;
  type: "agent_to_server" | "server_to_tool";
  metadata?: Record<string, any>;
}

interface TopologyResponse {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
  stats: {
    serverCount: number;
    agentCount: number;
    toolCount: number;
    edgeCount: number;
  };
}

/**
 * GET /mcp/topology
 * Get complete MCP orchestration topology
 */
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ownerId = "user_default" } = req.query;

    logger.info("[topology] 📊 Fetching topology", { ownerId });

    // Fetch all servers
    const servers = await MCPServer.find({ ownerId });

    // Fetch all agents
    const agents = await MCPAgent.find({ ownerId });

    // Build topology
    const nodes: TopologyNode[] = [];
    const edges: TopologyEdge[] = [];
    const toolSet = new Set<string>();

    // Add server nodes
    for (const server of servers) {
      nodes.push({
        id: server.serverId,
        type: "server",
        name: server.name,
        status: server.status,
        metadata: {
          description: server.description,
          toolCount: server.tools.length,
          resourceCount: server.resources.length,
          createdAt: server.createdAt,
        },
      });

      // Add tool nodes and server-to-tool edges
      for (const tool of server.tools) {
        const toolNodeId = `${server.serverId}:${tool.toolId}`;
        
        if (!toolSet.has(toolNodeId)) {
          nodes.push({
            id: toolNodeId,
            type: "tool",
            name: tool.name,
            metadata: {
              toolId: tool.toolId,
              serverId: server.serverId,
              description: tool.description,
            },
          });
          toolSet.add(toolNodeId);
        }

        edges.push({
          id: `edge_${server.serverId}_${tool.toolId}`,
          source: server.serverId,
          target: toolNodeId,
          type: "server_to_tool",
          metadata: {
            toolId: tool.toolId,
          },
        });
      }
    }

    // Add agent nodes and agent-to-server edges
    for (const agent of agents) {
      nodes.push({
        id: agent.agentId,
        type: "agent",
        name: agent.name,
        metadata: {
          description: agent.description,
          allowedTools: agent.allowedTools,
          attachedServerCount: agent.attachedServers.length,
          createdAt: agent.createdAt,
        },
      });

      // Add agent-to-server edges
      for (const serverId of agent.attachedServers) {
        edges.push({
          id: `edge_${agent.agentId}_${serverId}`,
          source: agent.agentId,
          target: serverId,
          type: "agent_to_server",
          metadata: {
            allowedTools: agent.allowedTools,
          },
        });
      }
    }

    // Get runtime status
    const runtimes = runtimeManager.listRuntimes();
    for (const runtime of runtimes) {
      const serverNode = nodes.find((n) => n.id === runtime.serverId);
      if (serverNode) {
        serverNode.status = runtime.status;
        serverNode.metadata = {
          ...serverNode.metadata,
          runtimeStatus: runtime.status,
          runtimeAgentCount: runtime.agents.length,
        };
      }
    }

    const response: TopologyResponse = {
      nodes,
      edges,
      stats: {
        serverCount: servers.length,
        agentCount: agents.length,
        toolCount: toolSet.size,
        edgeCount: edges.length,
      },
    };

    logger.info("[topology] ✅ Topology generated", {
      ownerId,
      stats: response.stats,
    });

    res.status(200).json(response);
  } catch (error) {
    logger.error("[topology] ❌ Error generating topology", {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    next(error);
  }
});

/**
 * GET /mcp/topology/agent/:agentId
 * Get topology for a specific agent
 */
router.get("/agent/:agentId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { agentId } = req.params;
    const { ownerId = "user_default" } = req.query;

    const agent = await MCPAgent.findOne({ agentId, ownerId });

    if (!agent) {
      res.status(404).json({
        error: "Agent not found",
      });
      return;
    }

    // Get attached servers
    const servers = await MCPServer.find({
      serverId: { $in: agent.attachedServers },
      ownerId,
    });

    const nodes: TopologyNode[] = [];
    const edges: TopologyEdge[] = [];

    // Add agent node
    nodes.push({
      id: agent.agentId,
      type: "agent",
      name: agent.name,
      metadata: {
        description: agent.description,
        allowedTools: agent.allowedTools,
      },
    });

    // Add server nodes and edges
    for (const server of servers) {
      nodes.push({
        id: server.serverId,
        type: "server",
        name: server.name,
        status: server.status,
      });

      edges.push({
        id: `edge_${agent.agentId}_${server.serverId}`,
        source: agent.agentId,
        target: server.serverId,
        type: "agent_to_server",
      });

      // Add allowed tools
      for (const tool of server.tools) {
        if (agent.allowedTools.includes(tool.toolId)) {
          const toolNodeId = `${server.serverId}:${tool.toolId}`;
          
          nodes.push({
            id: toolNodeId,
            type: "tool",
            name: tool.name,
            metadata: {
              toolId: tool.toolId,
              allowed: true,
            },
          });

          edges.push({
            id: `edge_${server.serverId}_${tool.toolId}`,
            source: server.serverId,
            target: toolNodeId,
            type: "server_to_tool",
          });
        }
      }
    }

    res.status(200).json({
      nodes,
      edges,
      stats: {
        serverCount: servers.length,
        toolCount: nodes.filter((n) => n.type === "tool").length,
        edgeCount: edges.length,
      },
    });
  } catch (error) {
    logger.error("[topology] ❌ Error generating agent topology", {
      error: (error as Error).message,
    });
    next(error);
  }
});

export default router;
