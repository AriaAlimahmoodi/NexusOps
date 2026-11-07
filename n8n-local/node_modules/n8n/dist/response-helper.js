"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isUniqueConstraintError = void 0;
exports.sendSuccessResponse = sendSuccessResponse;
exports.sendErrorResponse = sendErrorResponse;
exports.reportError = reportError;
exports.send = send;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const db_1 = require("@n8n/db");
Object.defineProperty(exports, "isUniqueConstraintError", { enumerable: true, get: function () { return db_1.isUniqueConstraintError; } });
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const n8n_workflow_1 = require("n8n-workflow");
const node_stream_1 = require("node:stream");
const picocolors_1 = __importDefault(require("picocolors"));
const webhook_response_headers_1 = require("./webhooks/webhook-response-headers");
function sendSuccessResponse(res, data, raw, responseCode, responseHeader) {
    if (responseCode !== undefined) {
        res.status(responseCode);
    }
    if (responseHeader) {
        res.header(responseHeader);
    }
    if (data instanceof node_stream_1.Readable) {
        data.pipe(res);
        return;
    }
    if (raw === true) {
        if (typeof data === 'string') {
            res.send(data);
        }
        else {
            res.json(data);
        }
    }
    else {
        res.json({
            data,
        });
    }
}
function sendErrorResponse(res, error) {
    if ((0, backend_services_1.isResponseError)(error)) {
        if (backend_common_1.inDevelopment) {
            di_1.Container.get(backend_common_1.Logger).error(picocolors_1.default.red([error.httpStatusCode, error.message].join(' ')));
        }
        const { originalUrl } = res.req;
        if (error.errorCode === 404 && originalUrl) {
            const basePath = originalUrl.split('/')[1];
            const isLegacyFormTrigger = originalUrl.includes(n8n_workflow_1.FORM_TRIGGER_PATH_IDENTIFIER);
            const isFormTrigger = basePath.includes('form');
            if (isFormTrigger || isLegacyFormTrigger) {
                const isTestWebhook = basePath.includes('test');
                res.status(404);
                (0, webhook_response_headers_1.applySandboxCSP)(res, 'form');
                return res.render('form-trigger-404', { isTestWebhook });
            }
        }
        if (error.errorCode === 409 && originalUrl && originalUrl.includes('form-waiting')) {
            (0, webhook_response_headers_1.applySandboxCSP)(res, 'form');
            return res.render('form-trigger-409', {
                message: error.message,
            });
        }
    }
    const descriptor = (0, backend_services_1.classifyRestError)(error);
    const { status, body: response } = (0, backend_services_1.serializeInternalRestError)(descriptor);
    if (error instanceof n8n_workflow_1.NodeApiError) {
        if (backend_common_1.inDevelopment) {
            di_1.Container.get(backend_common_1.Logger).error([picocolors_1.default.red(error.name), error.message].join(' '));
        }
        Object.assign(response, error);
    }
    if (error.stack && backend_common_1.inDevelopment) {
        response.stacktrace = error.stack;
    }
    res.setHeader('Content-Type', 'application/json');
    res.status(status).json(response);
}
function reportError(error, options) {
    if (!(0, backend_services_1.isResponseError)(error) || error.httpStatusCode > 404) {
        di_1.Container.get(n8n_core_1.ErrorReporter).error(error, options);
    }
}
function send(processFunction, raw = false) {
    return async (req, res) => {
        try {
            const data = await processFunction(req, res);
            if (!res.headersSent)
                sendSuccessResponse(res, data, raw);
        }
        catch (e) {
            const error = (0, ensure_error_1.ensureError)(e);
            const user = req.user;
            reportError(error, {
                extra: {
                    method: req.method,
                    path: req.path,
                    user: user ? { id: user.id } : undefined,
                },
            });
            if ((0, db_1.isUniqueConstraintError)(error)) {
                error.message = 'There is already an entry with this name';
            }
            sendErrorResponse(res, error);
        }
    };
}
//# sourceMappingURL=response-helper.js.map