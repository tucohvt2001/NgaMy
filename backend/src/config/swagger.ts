import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env';

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CLB Lân Sư Rồng Nga My Thượng - API',
      version: '1.0.0',
      description: 'API quản lý hoạt động của CLB Lân Sư Rồng Nga My Thượng',
    },
    servers: [{ url: `http://localhost:${env.port}/api`, description: 'Local server' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/**/*.ts'],
});
