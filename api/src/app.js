import express from 'express';

import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { createAuthRoutes } from './routes/authRoutes.js';
import { healthRoutes } from './routes/healthRoutes.js';

const JSON_BODY_LIMIT = '32kb';

export function createApp({ authService, registerRoutes } = {}) {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json({ limit: JSON_BODY_LIMIT }));
  app.use('/health', healthRoutes);

  if (authService !== undefined) {
    app.use(createAuthRoutes({ authService }));
  }

  if (registerRoutes !== undefined) {
    if (typeof registerRoutes !== 'function') {
      throw new TypeError('registerRoutes must be a function.');
    }

    registerRoutes(app);
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export const app = createApp();

export default app;
