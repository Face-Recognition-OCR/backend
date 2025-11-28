import express, { Express, Request, Response, NextFunction } from 'express';
import path from 'path';
import cors from 'cors';
import router from './router';

interface AppError extends Error {
  status?: number;
}

export function createApp(): Express {
  const app = express();

  // Middleware
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  app.use(cors() as unknown as express.RequestHandler);
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Serve static files from public folder
  const publicPath = path.join(__dirname, '..', 'public');
  app.use(express.static(publicPath));

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
  });

  // API routes
  app.use('/api', router);

  // Serve index.html for SPA routing
  app.get('/', (_req: Request, res: Response) => {
    res.sendFile(path.join(publicPath, 'index.html'));
  });

  // 404 handler for API routes
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found' });
  });

  // Error handling middleware
  app.use((err: AppError, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Error:', err);
    const statusCode = err.status || 500;
    res.status(statusCode).json({
      error: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  });

  return app;
}
