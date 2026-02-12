/**
 * Agent Routes
 * REST API for agent management
 */

import { Router, Request, Response, NextFunction } from "express";
import {
  createAgent,
  getAgent,
  listAgents,
  updateAgentPermissions,
  attachAgentToServer,
  detachAgentFromServer,
  deleteAgent,
} from "../services/agent.service";
import { logger } from "../utils/logger";
import { SocketServer } from "../socket";

const router = Router();

// Store socketServer reference
let socketServer: SocketServer;

/**
 * Initialize agent routes with socket server
 */
export function initAgentRoutes(socket: SocketServer): Router {
  socketServer = socket;
  return router;
}

/**
 * POST /agents
 * Create a new agent
 */
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, allowedTools, ownerId = "user_default" } = req.body;

    if (!name || !Array.isArray(allowedTools)) {
      res.status(400).json({
        error: "name and allowedTools[] are required",
      });
      return;
    }

    const agent = await createAgent({
      name,
      description,
      allowedTools,
      ownerId,
    });

    // Emit socket event
    if (socketServer) {
      socketServer.io.emit("agent_created", {
        agentId: agent.agentId,
        name: agent.name,
        ownerId,
        timestamp: new Date().toISOString(),
      });
    }

    logger.info("[createAgent] ✅ Agent created", {
      agentId: agent.agentId,
      name: agent.name,
    });

    res.status(201).json(agent);
  } catch (error) {
    logger.error("[createAgent] ❌ Error creating agent", {
      error: (error as Error).message,
    });
    next(error);
  }
});

/**
 * GET /agents
 * List all agents for an owner
 */
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ownerId = "user_default" } = req.query;

    const agents = await listAgents(ownerId as string);

    logger.info("[listAgents] ✅ Agents listed", {
      count: agents.length,
      ownerId,
    });

    res.status(200).json({
      agents,
      count: agents.length,
    });
  } catch (error) {
    logger.error("[listAgents] ❌ Error listing agents", {
      error: (error as Error).message,
    });
    next(error);
  }
});

/**
 * GET /agents/:agentId
 * Get agent by ID
 */
router.get("/:agentId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { agentId } = req.params;
    const { ownerId = "user_default" } = req.query;

    const agent = await getAgent(agentId, ownerId as string);

    if (!agent) {
      res.status(404).json({
        error: "Agent not found",
      });
      return;
    }

    logger.info("[getAgent] ✅ Agent retrieved", {
      agentId,
    });

    res.status(200).json(agent);
  } catch (error) {
    logger.error("[getAgent] ❌ Error getting agent", {
      error: (error as Error).message,
    });
    next(error);
  }
});

/**
 * PUT /agents/:agentId/permissions
 * Update agent permissions
 */
router.put("/:agentId/permissions", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { agentId } = req.params;
    const { allowedTools, ownerId = "user_default" } = req.body;

    if (!Array.isArray(allowedTools)) {
      res.status(400).json({
        error: "allowedTools[] is required",
      });
      return;
    }

    const agent = await updateAgentPermissions(agentId, ownerId, { allowedTools });

    if (!agent) {
      res.status(404).json({
        error: "Agent not found",
      });
      return;
    }

    // Emit socket event
    if (socketServer) {
      socketServer.io.emit("permissions_updated", {
        agentId,
        allowedTools,
        timestamp: new Date().toISOString(),
      });
    }

    logger.info("[updatePermissions] ✅ Permissions updated", {
      agentId,
      allowedTools,
    });

    res.status(200).json(agent);
  } catch (error) {
    logger.error("[updatePermissions] ❌ Error updating permissions", {
      error: (error as Error).message,
    });
    next(error);
  }
});

/**
 * POST /agents/:agentId/attach/:serverId
 * Attach agent to MCP server
 */
router.post("/:agentId/attach/:serverId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { agentId, serverId } = req.params;
    const { ownerId = "user_default" } = req.body;

    const attached = await attachAgentToServer(agentId, serverId, ownerId);

    // Emit socket event
    if (socketServer && attached) {
      socketServer.io.emit("agent_attached", {
        agentId,
        serverId,
        timestamp: new Date().toISOString(),
      });
    }

    logger.info("[attachAgent] ✅ Agent attached to server", {
      agentId,
      serverId,
      attached,
    });

    res.status(200).json({
      success: true,
      attached,
      agentId,
      serverId,
    });
  } catch (error) {
    logger.error("[attachAgent] ❌ Error attaching agent", {
      error: (error as Error).message,
    });
    next(error);
  }
});

/**
 * POST /agents/:agentId/detach/:serverId
 * Detach agent from MCP server
 */
router.post("/:agentId/detach/:serverId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { agentId, serverId } = req.params;
    const { ownerId = "user_default" } = req.body;

    const detached = await detachAgentFromServer(agentId, serverId, ownerId);

    // Emit socket event
    if (socketServer && detached) {
      socketServer.io.emit("agent_detached", {
        agentId,
        serverId,
        timestamp: new Date().toISOString(),
      });
    }

    logger.info("[detachAgent] ✅ Agent detached from server", {
      agentId,
      serverId,
      detached,
    });

    res.status(200).json({
      success: true,
      detached,
      agentId,
      serverId,
    });
  } catch (error) {
    logger.error("[detachAgent] ❌ Error detaching agent", {
      error: (error as Error).message,
    });
    next(error);
  }
});

/**
 * DELETE /agents/:agentId
 * Delete agent
 */
router.delete("/:agentId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { agentId } = req.params;
    const { ownerId = "user_default" } = req.query;

    const deleted = await deleteAgent(agentId, ownerId as string);

    if (!deleted) {
      res.status(404).json({
        error: "Agent not found",
      });
      return;
    }

    logger.info("[deleteAgent] ✅ Agent deleted", {
      agentId,
    });

    res.status(200).json({
      success: true,
      deleted: true,
      agentId,
    });
  } catch (error) {
    logger.error("[deleteAgent] ❌ Error deleting agent", {
      error: (error as Error).message,
    });
    next(error);
  }
});

export default router;
