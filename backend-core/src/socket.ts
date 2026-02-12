import { Server } from "socket.io";
import http from "http";
import { logger } from "./utils/logger";

let io: Server | null = null;

export interface SocketServer {
  io: Server;
  emitExecutionLog(executionId: string, logData: ExecutionLogData): void;
}

export interface ExecutionLogData {
  type: 'step_start' | 'step_complete' | 'step_error' | 'workflow_complete';
  stepIndex?: number;
  stepType?: string;
  stepName?: string;
  data?: any;
  error?: string;
  timestamp: string;
  output?: any;
  input?: any;
  durationMs?: number;
}

/**
 * Initialize Socket.io server
 * Migrated from backend/src/lib/socket.ts - removed Redis dependencies
 */
export function initSocket(httpServer: http.Server): SocketServer {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

  io = new Server(httpServer, {
    cors: {
      origin: frontendUrl,
      credentials: true,
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket) => {
    logger.info("🔌 Socket connected", { socketId: socket.id });

    // Handle client joining execution room
    socket.on("join-execution", (executionId: string) => {
      socket.join(executionId);
      logger.info("📡 Joined execution room", {
        socketId: socket.id,
        executionId,
      });

      // Acknowledge join
      socket.emit("joined-execution", { executionId });
    });

    // Handle client leaving execution room
    socket.on("leave-execution", (executionId: string) => {
      socket.leave(executionId);
      logger.info("📤 Left execution room", {
        socketId: socket.id,
        executionId,
      });
    });

    // Handle disconnection
    socket.on("disconnect", (reason) => {
      logger.info("🔌 Socket disconnected", {
        socketId: socket.id,
        reason,
      });
    });

    // Handle errors
    socket.on("error", (error) => {
      logger.error("Socket error", {
        socketId: socket.id,
        error: error.message,
      });
    });
  });

  logger.info("✅ Socket.io initialized", { frontendUrl });

  // Return SocketServer interface
  return {
    io,
    emitExecutionLog: (executionId: string, logData: ExecutionLogData) => {
      if (!io) {
        logger.error("Socket.io not initialized");
        return;
      }

      // Emit to specific execution room
      io.to(executionId).emit("execution-log", logData);

      logger.debug("Emitted execution log", {
        executionId,
        type: logData.type,
        stepIndex: logData.stepIndex,
      });
    },
  };
}

/**
 * Get Socket.io instance
 * Throws error if not initialized
 */
export function getIO(): Server {
  if (!io) {
    throw new Error("Socket.io not initialized. Call initSocket() first.");
  }
  return io;
}

export default { initSocket, getIO };
