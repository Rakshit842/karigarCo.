"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const config_1 = require("../config");
exports.logger = winston_1.default.createLogger({
    level: config_1.config.isDev ? 'debug' : 'info',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), config_1.config.isDev
        ? winston_1.default.format.colorize()
        : winston_1.default.format.json(), winston_1.default.format.printf(({ timestamp, level, message, stack }) => {
        if (stack) {
            return `${timestamp} [${level}]: ${message}\n${stack}`;
        }
        return `${timestamp} [${level}]: ${message}`;
    })),
    transports: [
        new winston_1.default.transports.Console(),
        ...(config_1.config.isDev
            ? []
            : [new winston_1.default.transports.File({ filename: 'logs/error.log', level: 'error' }),
                new winston_1.default.transports.File({ filename: 'logs/combined.log' })]),
    ],
});
//# sourceMappingURL=logger.js.map