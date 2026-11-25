import app from './app';
import { config } from './config';
import { prisma } from './config/database';
import { logger } from './utils/logger';

async function main() {
  try {
    await prisma.$connect();
    logger.info('✅ Database connected');

    app.listen(config.port, () => {
      logger.info(`🚀 KarigarCo. API running on port ${config.port}`);
      logger.info(`📚 Swagger docs: http://localhost:${config.port}/api-docs`);
      logger.info(`🌍 Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  logger.info('Database disconnected on shutdown');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  logger.info('Database disconnected on termination');
  process.exit(0);
});

main();
