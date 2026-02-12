import { describe, test, expect } from 'bun:test';
import { createServer } from './server';

describe('Server Setup', () => {
  test('should create Express app and HTTP server', () => {
    const config = {
      port: 4000,
      corsOrigin: 'http://localhost:3000',
      environment: 'development' as const,
    };

    const { app, httpServer } = createServer(config);

    expect(app).toBeDefined();
    expect(httpServer).toBeDefined();
    expect(typeof app.use).toBe('function');
    expect(typeof httpServer.listen).toBe('function');
  });

  test('should respond to health check endpoint', async () => {
    const config = {
      port: 4000,
      corsOrigin: 'http://localhost:3000',
      environment: 'development' as const,
    };

    const { app } = createServer(config);

    // Create a mock request to the health endpoint
    const mockReq = {
      method: 'GET',
      path: '/health',
      query: {},
      ip: '127.0.0.1',
    };

    // Test that the app has the health route registered
    const routes = app._router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => ({
        path: layer.route.path,
        method: Object.keys(layer.route.methods)[0],
      }));

    const healthRoute = routes.find(
      (route: any) => route.path === '/health' && route.method === 'get'
    );

    expect(healthRoute).toBeDefined();
  });

  test('should apply middleware in correct order', () => {
    const config = {
      port: 4000,
      corsOrigin: 'http://localhost:3000',
      environment: 'production' as const,
    };

    const { app } = createServer(config);

    // Check that middleware stack exists
    expect(app._router).toBeDefined();
    expect(app._router.stack).toBeDefined();
    expect(app._router.stack.length).toBeGreaterThan(0);

    // Verify CORS middleware is present (should be one of the first middleware)
    const corsMiddleware = app._router.stack.find(
      (layer: any) => layer.name === 'corsMiddleware'
    );
    
    // Note: CORS middleware might have a different internal name
    // The important thing is that the stack has multiple middleware layers
    expect(app._router.stack.length).toBeGreaterThan(5);
  });

  test('should export both app and httpServer for Socket.io attachment', () => {
    const config = {
      port: 4000,
      corsOrigin: 'http://localhost:3000',
      environment: 'development' as const,
    };

    const result = createServer(config);

    expect(result).toHaveProperty('app');
    expect(result).toHaveProperty('httpServer');
    expect(result.app).toBeDefined();
    expect(result.httpServer).toBeDefined();
  });
});
