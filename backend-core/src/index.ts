import dotenv from 'dotenv';
import { Request, Response, NextFunction } from 'express';
import { createServer } from './server';
import { initSocket } from './socket';
import { connectMongo } from './db/mongo';
import { sessionCleanupJob } from './services/sessionCleanupJob';
import { logger } from './utils/logger';
import { errorMiddleware } from './middleware/error.middleware';

// Routes
import authRoutes from './routes/auth.routes';
import workflowRoutes from './routes/workflow.routes';
import { initExecutionRoutes } from './routes/execution.routes';
import { initAIRoutes } from './routes/ai.routes';
import collectionRoutes from './routes/collection.routes';
import { initAgentRoutes } from './routes/agent.routes';
import topologyRoutes from './routes/topology.routes';
import { initMCPRoutes } from './routes/mcp.routes';
import mcpRoutes from './routes/mcp.routes';

// Load environment variables
dotenv.config();

// Server configuration
const PORT = parseInt(process.env.PORT || '4000', 10);
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const NODE_ENV = (process.env.NODE_ENV || 'development') as 'development' | 'production';

async function startServer() {
  try {
    logger.info('🚀 Starting Orchestrix Backend Core', {
      port: PORT,
      environment: NODE_ENV,
      frontendUrl: FRONTEND_URL,
    });

    // Connect to MongoDB
    logger.info('📦 Connecting to MongoDB...');
    await connectMongo();
    logger.info('✅ MongoDB connected');

    // Create HTTP server
    logger.info('🌐 Creating HTTP server...');
    const { app, httpServer } = createServer({
      port: PORT,
      corsOrigin: FRONTEND_URL,
      environment: NODE_ENV,
    });

    // Initialize Socket.io
    logger.info('🔌 Initializing Socket.io...');
    const socketServer = initSocket(httpServer);
    logger.info('✅ Socket.io initialized');

    // Register routes
    logger.info('📍 Registering routes...');
    app.use('/auth', authRoutes);
    app.use('/workflows', workflowRoutes);
    app.use('/workflows', initExecutionRoutes(socketServer));
    app.use('/ai', initAIRoutes(socketServer));
    app.use('/collections', collectionRoutes);
    app.use('/agents', initAgentRoutes(socketServer));
    app.use('/mcp/topology', topologyRoutes);
    app.use('/mcp', initMCPRoutes(socketServer));
    
    // Legacy route aliases for frontend compatibility
    app.use('/db/schemas', collectionRoutes); // Alias for /collections
    app.use('/workflow', workflowRoutes); // Alias for /workflows (singular)
    app.use('/workflow', initExecutionRoutes(socketServer)); // Alias for execution routes
    
    logger.info('✅ Routes registered');

    // 404 handler for undefined routes - MUST be after all routes
    app.use((req: Request, res: Response) => {
      logger.warn('Route not found', {
        method: req.method,
        path: req.path,
        query: req.query,
      });
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
        timestamp: new Date().toISOString(),
      });
    });

    // Global error handling middleware - MUST be last
    app.use(errorMiddleware);

    // Start session cleanup job
    logger.info('🧹 Starting session cleanup job...');
    sessionCleanupJob.start();
    logger.info('✅ Session cleanup job started');

    // Start HTTP server
    httpServer.listen(PORT, '0.0.0.0', () => {
      logger.info('✅ Server started successfully', {
        port: PORT,
        environment: NODE_ENV,
        frontendUrl: FRONTEND_URL,
        timestamp: new Date().toISOString(),
      });
      logger.info(`🌍 Server listening on http://0.0.0.0:${PORT}`);
      logger.info(`🔗 Frontend URL: ${FRONTEND_URL}`);
      logger.info(`📊 Health check: http://0.0.0.0:${PORT}/health`);
    });

    // Graceful shutdown handlers
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully...`);

      // Stop accepting new connections
      httpServer.close(() => {
        logger.info('HTTP server closed');
      });

      // Stop session cleanup job
      sessionCleanupJob.stop();
      logger.info('Session cleanup job stopped');

      // Close Socket.io connections
      socketServer.io.close(() => {
        logger.info('Socket.io connections closed');
      });

      // Disconnect from MongoDB
      try {
        const { disconnectMongo } = await import('./db/mongo');
        await disconnectMongo();
        logger.info('MongoDB disconnected');
      } catch (error) {
        logger.error('Error disconnecting from MongoDB', {
          error: (error as Error).message,
        });
      }

      logger.info('Shutdown complete');
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', {
        error: error.message,
        stack: error.stack,
      });
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled promise rejection', {
        reason,
        promise,
      });
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start server', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    process.exit(1);
  }
}

// Start the server
startServer();
