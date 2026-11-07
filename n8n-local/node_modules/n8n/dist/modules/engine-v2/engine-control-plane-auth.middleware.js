"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEngineControlPlaneAuthMiddleware = createEngineControlPlaneAuthMiddleware;
const engine_1 = require("@n8n/engine");
const errors_1 = require("@n8n/errors");
const BEARER_PREFIX = /^bearer /i;
function createEngineControlPlaneAuthMiddleware(engineConfig, logger, requiredScope) {
    const reject = (req, res, reason) => {
        logger.warn(`Rejected ${req.method} ${req.originalUrl} - ${reason}`);
        const error = new errors_1.UnauthenticatedError();
        res.status(error.httpStatusCode).json({ code: error.errorCode, message: error.message });
    };
    return (req, res, next) => {
        const header = req.header('authorization') ?? '';
        if (!BEARER_PREFIX.test(header)) {
            reject(req, res, 'no bearer token');
            return;
        }
        try {
            (0, engine_1.verifyActionToken)(engineConfig.authSecret, header.replace(BEARER_PREFIX, ''), requiredScope);
        }
        catch (error) {
            if (!(error instanceof engine_1.InvalidActionTokenError))
                throw error;
            reject(req, res, 'token rejected');
            return;
        }
        next();
    };
}
//# sourceMappingURL=engine-control-plane-auth.middleware.js.map