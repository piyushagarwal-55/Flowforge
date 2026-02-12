import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import http from 'http';
import { logger } from './utils/logger';

export interface ServerConfig {
  port: number;
  corsOrigin: string;
  environment: 'development' | 'production';
}

export function createServer(config: ServerConfig): {
  app: Express;
  httpServer: http.Server;
} {
  const app = express();

  // 1. CORS middleware - must be first to handle preflight requests
  app.use(cors({
    origin: config.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // 2. Body parser middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 3. Request logging middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    // Log request
    logger.info('Incoming request', {
      method: req.method,
      path: req.path,
      query: req.query,
      ip: req.ip,
    });

    // Log response when finished
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      logger.info('Request completed', {
        method: req.method,
        path: req.path,
        status: res.statusCode,
        duration: `${duration}ms`,
      });
    });

    next();
  });

  // Health check endpoint
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      environment: config.environment,
    });
  });

  // Routes will be added here by index.ts
  // app.use('/auth', authRoutes);
  // app.use('/workflows', workflowRoutes);
  // etc.
  
  // Note: 404 and error handlers are registered in index.ts AFTER routes

  // Create HTTP server
  const httpServer = http.createServer(app);

  return { app, httpServer };
}
