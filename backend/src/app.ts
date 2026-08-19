import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { swaggerSpec } from './config/swagger';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';

export function createApp(): Application {
  const app: Application = express();

  const allowedOrigins = env.corsOrigin.split(',').map((origin) => origin.trim().replace(/\/$/, ''));

  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        // Cho phép request không có origin (Postman, server-to-server) và các origin được cấu hình
        if (
          !origin ||
          allowedOrigins.includes('*') ||
          allowedOrigins.includes(origin) ||
          allowedOrigins.includes(origin.replace(/\/$/, ''))
        ) {
          callback(null, true);
          return;
        }
        callback(new Error(`Not allowed by CORS: ${origin}`));
      },
      credentials: true,
    }),
  );
  app.use(compression());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.use('/api', routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
