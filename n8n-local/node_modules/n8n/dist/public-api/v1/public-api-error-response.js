"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPublicApiErrorResponse = sendPublicApiErrorResponse;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const sanitize_error_detail_1 = require("@n8n/utils/redaction/sanitize-error-detail");
const MAX_LOGGED_MESSAGE_LENGTH = 1000;
const MAX_LOGGED_STACK_LENGTH = 4000;
function getStackFrames(error) {
    if (!error.stack) {
        return undefined;
    }
    const framesStart = error.stack.indexOf('\n    at ');
    return framesStart === -1 ? error.stack : error.stack.slice(framesStart);
}
function sendPublicApiErrorResponse(res, error) {
    const descriptor = (0, backend_services_1.classifyRestError)(error);
    const shouldReport = descriptor.kind === "serverError" ||
        descriptor.kind === "unexpectedError" ||
        (descriptor.kind === "responseError" && descriptor.status >= 500);
    if (shouldReport) {
        try {
            const logger = di_1.Container.get(backend_common_1.Logger);
            const req = res.req;
            const method = req.method;
            const route = `${req.baseUrl}${req.route?.path ?? req.path}`;
            const userId = (0, db_1.isAuthenticatedRequest)(req) ? req.user.id : undefined;
            const message = (0, sanitize_error_detail_1.sanitizeErrorDetail)(error.message, MAX_LOGGED_MESSAGE_LENGTH);
            const frames = getStackFrames(error);
            logger.error(`Public API request failed (${method} ${route}): ${error.name}: ${message}`, {
                method,
                route,
                userId,
                errorName: error.name,
                stack: frames ? (0, sanitize_error_detail_1.sanitizeErrorDetail)(frames, MAX_LOGGED_STACK_LENGTH) : undefined,
            });
        }
        catch (failure) {
            try {
                di_1.Container.get(backend_common_1.Logger).error('Failed to log Public API server error', {
                    errorName: (0, ensure_error_1.ensureError)(failure).name,
                });
            }
            catch {
            }
        }
    }
    const { status, body } = (0, backend_services_1.serializePublicApiError)(descriptor);
    res.status(status).json(body);
}
//# sourceMappingURL=public-api-error-response.js.map