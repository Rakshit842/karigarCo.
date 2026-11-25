import { Express } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { config } from '../config';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'KarigarCo. API',
      version: '1.0.0',
      description: 'KarigarCo. by Viraasat — Indian Artisan Marketplace REST API',
    },
    servers: [
      { url: `http://localhost:${config.port}`, description: 'Development' },
    ],
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
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const setupSwagger = (app: Express) => {
  const spec = swaggerJsdoc(options);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(spec, {
    customCss: '.swagger-ui .topbar { background: #2d5016; }',
    customSiteTitle: 'KarigarCo. API Docs',
  }));
};
