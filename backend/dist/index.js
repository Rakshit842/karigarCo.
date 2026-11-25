"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const config_1 = require("./config");
const database_1 = require("./config/database");
const logger_1 = require("./utils/logger");
async function main() {
    try {
        await database_1.prisma.$connect();
        logger_1.logger.info('✅ Database connected');
        app_1.default.listen(config_1.config.port, () => {
            logger_1.logger.info(`🚀 KarigarCo. API running on port ${config_1.config.port}`);
            logger_1.logger.info(`📚 Swagger docs: http://localhost:${config_1.config.port}/api-docs`);
            logger_1.logger.info(`🌍 Environment: ${config_1.config.nodeEnv}`);
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to start server:', error);
        await database_1.prisma.$disconnect();
        process.exit(1);
    }
}
process.on('SIGINT', async () => {
    await database_1.prisma.$disconnect();
    logger_1.logger.info('Database disconnected on shutdown');
    process.exit(0);
});
process.on('SIGTERM', async () => {
    await database_1.prisma.$disconnect();
    logger_1.logger.info('Database disconnected on termination');
    process.exit(0);
});
main();
//# sourceMappingURL=index.js.map