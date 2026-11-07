"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createJitterMiddleware = void 0;
const sleep_1 = require("@n8n/utils/sleep");
const createJitterMiddleware = (options = {}) => {
    const minMs = options.minMs ?? 100;
    const maxMs = options.maxMs ?? 300;
    return async (_req, _res, next) => {
        const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
        await (0, sleep_1.sleep)(delay);
        next();
    };
};
exports.createJitterMiddleware = createJitterMiddleware;
//# sourceMappingURL=jitter.js.map