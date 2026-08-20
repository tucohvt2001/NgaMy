import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';

const app = createApp();

const server = app.listen(env.port, '0.0.0.0', () => {
  logger.info(`Server đang chạy tại http://0.0.0.0:${env.port}`);
  logger.info(`Swagger docs tại http://localhost:${env.port}/api-docs`);
});

process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled Rejection: ${reason}`);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM nhận được, đóng server...');
  server.close(() => {
    logger.info('Server đã đóng.');
  });
});
