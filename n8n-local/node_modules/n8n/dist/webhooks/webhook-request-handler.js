"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWebhookHandlerFor = createWebhookHandlerFor;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const stream_1 = require("stream");
const promises_1 = require("stream/promises");
const webhook_not_found_error_1 = require("../errors/response-errors/webhook-not-found.error");
const webhook_and_form_metrics_service_1 = require("../metrics/prometheus/webhook-and-form-metrics.service");
const ResponseHelper = __importStar(require("../response-helper"));
const webhook_response_1 = require("../webhooks/webhook-response");
const webhook_response_headers_1 = require("../webhooks/webhook-response-headers");
const WEBHOOK_METHODS = ['DELETE', 'GET', 'HEAD', 'PATCH', 'POST', 'PUT'];
class WebhookRequestHandler {
    constructor(webhookManager, expectedNodeType, sandboxSetting = 'webhook') {
        this.webhookManager = webhookManager;
        this.expectedNodeType = expectedNodeType;
        this.sandboxSetting = sandboxSetting;
    }
    async handleRequest(req, res) {
        const method = req.method;
        (0, webhook_response_headers_1.setRouteSandboxSetting)(res, this.sandboxSetting);
        (0, webhook_response_headers_1.applySandboxCSP)(res);
        if (method !== 'OPTIONS' && !WEBHOOK_METHODS.includes(method)) {
            return ResponseHelper.sendErrorResponse(res, new Error(`The method ${method} is not supported.`));
        }
        if ('origin' in req.headers) {
            const corsSetupError = await this.setupCorsHeaders(req, res);
            if (corsSetupError) {
                return ResponseHelper.sendErrorResponse(res, corsSetupError);
            }
        }
        if (method === 'OPTIONS') {
            return ResponseHelper.sendSuccessResponse(res, {}, true, 204);
        }
        try {
            const response = await this.webhookManager.executeWebhook(req, res, this.expectedNodeType);
            if ((0, webhook_response_1.isWebhookResponse)(response)) {
                await this.sendWebhookResponse(res, response);
            }
            else if (response.noWebhookResponse !== true) {
                this.sendLegacyResponse(res, response.data, true, response.responseCode, response.headers);
            }
        }
        catch (e) {
            const error = (0, ensure_error_1.ensureError)(e);
            const logger = di_1.Container.get(backend_common_1.Logger);
            if (e instanceof webhook_not_found_error_1.WebhookNotFoundError) {
                logger.error(`Received request for unknown webhook: ${e.message}`);
            }
            else {
                logger.error(`Error in handling webhook request ${req.method} ${req.path}: ${error.message}`, { error });
            }
            return ResponseHelper.sendErrorResponse(res, error);
        }
    }
    async sendWebhookResponse(res, webhookResponse) {
        if ((0, webhook_response_1.isWebhookNoResponse)(webhookResponse)) {
            return;
        }
        if ((0, webhook_response_1.isWebhookStaticResponse)(webhookResponse)) {
            this.sendStaticResponse(res, webhookResponse);
            return;
        }
        if ((0, webhook_response_1.isWebhookStreamResponse)(webhookResponse)) {
            await this.sendStreamResponse(res, webhookResponse);
            return;
        }
    }
    async sendStreamResponse(res, webhookResponse) {
        const { stream, code, headers } = webhookResponse;
        this.setResponseStatus(res, code);
        this.setResponseHeaders(res, headers);
        stream.pipe(res, { end: false });
        await (0, promises_1.finished)(stream);
        process.nextTick(() => res.end());
    }
    sendStaticResponse(res, webhookResponse) {
        const { body, code, headers } = webhookResponse;
        this.setResponseStatus(res, code);
        this.setResponseHeaders(res, headers);
        if (typeof body === 'string') {
            res.send(body);
        }
        else {
            res.json(body);
        }
    }
    setResponseStatus(res, statusCode) {
        if (statusCode !== undefined) {
            res.status(statusCode);
        }
    }
    setResponseHeaders(res, headers) {
        headers?.applyToResponse(res);
        (0, webhook_response_headers_1.applySandboxCSP)(res);
    }
    sendLegacyResponse(res, data, raw, responseCode, responseHeader) {
        this.setResponseStatus(res, responseCode);
        if (responseHeader) {
            this.setResponseHeaders(res, webhook_response_headers_1.WebhookResponseHeaders.fromObject(responseHeader));
        }
        if (data instanceof stream_1.Readable) {
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
    async setupCorsHeaders(req, res) {
        const method = req.method;
        const { path } = req.params;
        if (this.webhookManager.getWebhookMethods) {
            try {
                const allowedMethods = await this.webhookManager.getWebhookMethods(path);
                res.header('Access-Control-Allow-Methods', ['OPTIONS', ...allowedMethods].join(', '));
            }
            catch (error) {
                return error;
            }
        }
        const requestedMethod = method === 'OPTIONS'
            ? req.headers['access-control-request-method']
            : method;
        if (this.webhookManager.findAccessControlOptions && requestedMethod) {
            const options = await this.webhookManager.findAccessControlOptions(path, requestedMethod);
            const { allowedOrigins } = options ?? {};
            if (allowedOrigins && allowedOrigins !== '*' && allowedOrigins !== req.headers.origin) {
                const originsList = allowedOrigins.split(',');
                const defaultOrigin = originsList[0];
                if (originsList.length === 1) {
                    res.header('Access-Control-Allow-Origin', defaultOrigin);
                }
                if (originsList.includes(req.headers.origin)) {
                    res.header('Access-Control-Allow-Origin', req.headers.origin);
                }
                else {
                    res.header('Access-Control-Allow-Origin', defaultOrigin);
                }
            }
            else {
                res.header('Access-Control-Allow-Origin', req.headers.origin);
            }
            if (method === 'OPTIONS') {
                res.header('Access-Control-Max-Age', '300');
                const requestedHeaders = req.headers['access-control-request-headers'];
                if (requestedHeaders?.length) {
                    res.header('Access-Control-Allow-Headers', requestedHeaders);
                }
            }
        }
        return null;
    }
}
function trackWebhookMetrics(metricsService, req, res, expectedNodeType, path) {
    const startNs = process.hrtime.bigint();
    res.on('finish', () => {
        try {
            const durationSeconds = Number(process.hrtime.bigint() - startNs) / 1e9;
            const workflowId = res.locals.workflowId ?? '';
            if (expectedNodeType === 'form') {
                if (req.method === 'POST') {
                    metricsService.observeFormSubmission({
                        statusCode: res.statusCode,
                        formPath: path,
                        workflowId,
                        durationSeconds,
                    });
                }
            }
            else {
                metricsService.observeWebhookRequest({
                    method: req.method,
                    statusCode: res.statusCode,
                    webhookPath: path,
                    workflowId,
                    durationSeconds,
                });
            }
        }
        catch {
        }
    });
}
function createWebhookHandlerFor(webhookManager, expectedNodeType, sandboxSetting = expectedNodeType === 'form' ? 'form' : 'webhook') {
    const handler = new WebhookRequestHandler(webhookManager, expectedNodeType, sandboxSetting);
    const metricsService = di_1.Container.get(webhook_and_form_metrics_service_1.PrometheusWebhookAndFormMetricsService);
    return async (req, res) => {
        const webhookRequest = req;
        const { params } = webhookRequest;
        if (Array.isArray(params.path)) {
            params.path = params.path.join('/');
        }
        if (expectedNodeType === 'form' || expectedNodeType === 'webhook') {
            trackWebhookMetrics(metricsService, req, res, expectedNodeType, params.path);
        }
        await handler.handleRequest(webhookRequest, res);
    };
}
//# sourceMappingURL=webhook-request-handler.js.map