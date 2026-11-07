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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WaitingWebhooks = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const crypto_1 = require("crypto");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const webhook_request_sanitizer_1 = require("./webhook-request-sanitizer");
const webhook_service_1 = require("./webhook.service");
const errors_1 = require("@n8n/errors");
const execution_persistence_1 = require("../executions/execution-persistence");
const execution_utils_1 = require("../executions/execution.utils");
const node_types_1 = require("../node-types");
const cors_util_1 = require("../utils/cors.util");
const WebhookHelpers = __importStar(require("../webhooks/webhook-helpers"));
const webhook_response_headers_1 = require("../webhooks/webhook-response-headers");
const WorkflowExecuteAdditionalData = __importStar(require("../workflow-execute-additional-data"));
const workflow_helpers_1 = require("../workflow-helpers");
let WaitingWebhooks = class WaitingWebhooks {
    constructor(logger, nodeTypes, executionPersistence, webhookService, instanceSettings, eventService, endpointsConfig) {
        this.logger = logger;
        this.nodeTypes = nodeTypes;
        this.executionPersistence = executionPersistence;
        this.webhookService = webhookService;
        this.instanceSettings = instanceSettings;
        this.eventService = eventService;
        this.endpointsConfig = endpointsConfig;
        this.includeForms = false;
    }
    async findAccessControlOptions() {
        return {
            allowedOrigins: '*',
        };
    }
    logReceivedWebhook(method, executionId) {
        this.logger.debug(`Received waiting-webhook "${method}" for execution "${executionId}"`);
    }
    disableNode(execution, _method) {
        execution.data.executionData.nodeExecutionStack[0].node.disabled = true;
    }
    isSendAndWaitRequest(nodes, suffix) {
        return (suffix &&
            Object.keys(nodes).some((node) => nodes[node].id === suffix && nodes[node].parameters.operation === n8n_workflow_1.SEND_AND_WAIT_OPERATION));
    }
    isFormResumeNode(node) {
        return (node.type === n8n_workflow_1.FORM_NODE_TYPE ||
            (node.type === n8n_workflow_1.WAIT_NODE_TYPE && node.parameters.resume === 'form'));
    }
    isFormResumeExecution(execution) {
        const lastNodeExecuted = execution.data.resultData?.lastNodeExecuted;
        if (!lastNodeExecuted) {
            return false;
        }
        const node = execution.workflowData?.nodes?.find((n) => n.name === lastNodeExecuted);
        if (!node) {
            return false;
        }
        return this.isFormResumeNode(node);
    }
    redirectToFormWaiting(req, res) {
        const location = req.originalUrl.replace(`/${this.endpointsConfig.webhookWaiting}/`, `/${this.endpointsConfig.formWaiting}/`);
        if (location === req.originalUrl) {
            return false;
        }
        res.redirect(307, location);
        return true;
    }
    createWorkflow(workflowData) {
        return new n8n_workflow_1.Workflow({
            id: workflowData.id,
            name: workflowData.name,
            nodes: workflowData.nodes,
            connections: workflowData.connections,
            active: (0, execution_utils_1.getWorkflowActiveStatusFromWorkflowData)(workflowData),
            nodeTypes: this.nodeTypes,
            staticData: workflowData.staticData,
            settings: workflowData.settings,
        });
    }
    async getExecution(executionId) {
        return await this.executionPersistence.findSingleExecution(executionId, {
            includeData: true,
            unflattenData: true,
        });
    }
    parseSignatureParam(req) {
        const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);
        let token = url.searchParams.get(n8n_core_1.WAITING_TOKEN_QUERY_PARAM) ?? undefined;
        let webhookPath;
        if (token?.includes('/')) {
            const slashIndex = token.indexOf('/');
            webhookPath = token.slice(slashIndex + 1);
            token = token.slice(0, slashIndex);
        }
        return { token, webhookPath };
    }
    validateToken(req, execution) {
        const { token, webhookPath } = this.parseSignatureParam(req);
        const storedToken = execution.data.resumeToken;
        if (!token || !storedToken || token.length !== storedToken.length) {
            return { valid: false };
        }
        const valid = (0, crypto_1.timingSafeEqual)(Buffer.from(token), Buffer.from(storedToken));
        return { valid, webhookPath };
    }
    validateSignature(req) {
        const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);
        const { token: providedSignature, webhookPath } = this.parseSignatureParam(req);
        if (!providedSignature) {
            return { valid: false };
        }
        url.searchParams.set(n8n_core_1.WAITING_TOKEN_QUERY_PARAM, providedSignature);
        const valid = (0, n8n_core_1.validateUrlSignature)(providedSignature, url, this.instanceSettings.hmacSignatureSecret);
        return { valid, webhookPath };
    }
    stripTokenFromRequest(req) {
        delete req.query[n8n_core_1.WAITING_TOKEN_QUERY_PARAM];
        const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);
        url.searchParams.delete(n8n_core_1.WAITING_TOKEN_QUERY_PARAM);
        req.url = `${url.pathname}${url.search}`;
    }
    async executeWebhook(req, res) {
        const { path: executionId } = req.params;
        let { suffix } = req.params;
        this.logReceivedWebhook(req.method, executionId);
        (0, webhook_request_sanitizer_1.sanitizeWebhookRequest)(req);
        req.params = {};
        const execution = await this.getExecution(executionId);
        if (execution?.data.resumeToken) {
            const { workflowData } = execution;
            const { nodes } = this.createWorkflow(workflowData);
            const effectiveSuffix = suffix ?? this.parseSignatureParam(req).webhookPath;
            const isSendAndWait = this.isSendAndWaitRequest(nodes, effectiveSuffix);
            const { valid, webhookPath } = isSendAndWait
                ? this.validateSignature(req)
                : this.validateToken(req, execution);
            if (!valid) {
                if (isSendAndWait) {
                    (0, webhook_response_headers_1.applyFormSandboxCSP)(res);
                    res.status(401).render('form-invalid-token');
                }
                else {
                    res.status(401).json({ error: 'Invalid token' });
                }
                return { noWebhookResponse: true };
            }
            this.stripTokenFromRequest(req);
            if (!suffix && webhookPath) {
                suffix = webhookPath;
            }
        }
        if (!execution) {
            throw new errors_1.NotFoundError(`The execution "${executionId}" does not exist.`);
        }
        if (!this.includeForms &&
            this.isFormResumeExecution(execution) &&
            this.redirectToFormWaiting(req, res)) {
            return { noWebhookResponse: true };
        }
        if (execution.status === 'running') {
            throw new errors_1.ConflictError(`The execution "${executionId}" is running already.`);
        }
        if (execution.data?.waitReason === 'suspended') {
            throw new errors_1.ConflictError(`The execution "${executionId}" is about to resume.`);
        }
        if (execution.data?.resultData?.error) {
            const message = `The execution "${executionId}" has finished with error.`;
            this.logger.debug(message, { error: execution.data.resultData.error });
            throw new errors_1.ConflictError(message);
        }
        if (execution.finished) {
            const { workflowData } = execution;
            const { nodes } = this.createWorkflow(workflowData);
            if (this.isSendAndWaitRequest(nodes, suffix)) {
                (0, webhook_response_headers_1.applyFormSandboxCSP)(res);
                res.render('send-and-wait-no-action-required', { isTestWebhook: false });
                return { noWebhookResponse: true };
            }
            else {
                throw new errors_1.ConflictError(`The execution "${executionId} has finished already.`);
            }
        }
        const lastNodeExecuted = execution.data.resultData.lastNodeExecuted;
        (0, cors_util_1.applyCors)(req, res);
        return await this.getWebhookExecutionData({
            execution,
            req,
            res,
            lastNodeExecuted,
            executionId,
            suffix,
        });
    }
    emitExecutionResumedEvent(execution, executionId, responseAt) {
        this.eventService.emit('execution-resumed', {
            executionId,
            workflowId: execution.workflowData.id,
            resumeSource: 'webhook',
            responseAt,
        });
    }
    async getWebhookExecutionData({ execution, req, res, lastNodeExecuted, executionId, suffix, }) {
        this.disableNode(execution, req.method);
        execution.data.waitTill = undefined;
        const nodeExecutionStack = execution.data.executionData?.nodeExecutionStack;
        const executionStackEntry = nodeExecutionStack?.[0];
        const isHitlNode = executionStackEntry?.node?.type?.endsWith('HitlTool') ?? false;
        if (isHitlNode && executionStackEntry) {
            executionStackEntry.node.rewireOutputLogTo = n8n_workflow_1.NodeConnectionTypes.AiTool;
        }
        const runDataArray = execution.data.resultData.runData[lastNodeExecuted];
        (0, workflow_helpers_1.preserveInputOverride)(runDataArray);
        const { workflowData } = execution;
        const workflow = this.createWorkflow(workflowData);
        const workflowStartNode = workflow.getNode(lastNodeExecuted);
        if (workflowStartNode === null) {
            throw new errors_1.NotFoundError('Could not find node to process webhook.');
        }
        const additionalData = await WorkflowExecuteAdditionalData.getBase({
            workflowId: workflow.id,
        });
        await workflow.expression.acquireIsolate();
        try {
            const webhookData = this.webhookService
                .getNodeWebhooks(workflow, workflowStartNode, additionalData)
                .find((webhook) => webhook.httpMethod === req.method &&
                webhook.path === (suffix ?? '') &&
                webhook.webhookDescription.restartWebhook === true &&
                (webhook.webhookDescription.nodeType === 'form' || false) === this.includeForms);
            if (webhookData === undefined) {
                const errorMessage = `The workflow for execution "${executionId}" does not contain a waiting webhook with a matching path/method.`;
                if (this.isSendAndWaitRequest(workflow.nodes, suffix)) {
                    (0, webhook_response_headers_1.applyFormSandboxCSP)(res);
                    res.render('send-and-wait-no-action-required', { isTestWebhook: false });
                    return { noWebhookResponse: true };
                }
                throw new errors_1.NotFoundError(errorMessage);
            }
            const runExecutionData = execution.data;
            const isWaitingForWebhook = !this.includeForms && !this.isSendAndWaitRequest(workflow.nodes, suffix);
            const responseAt = new Date();
            const onResume = isWaitingForWebhook
                ? () => this.emitExecutionResumedEvent(execution, executionId, responseAt)
                : undefined;
            return await new Promise((resolve, reject) => {
                WebhookHelpers.executeWebhook(workflow, webhookData, workflowData, workflowStartNode, execution.mode, runExecutionData.pushRef, runExecutionData, execution.id, req, res, (error, data) => {
                    if (error !== null) {
                        return reject(error);
                    }
                    resolve(data);
                }, undefined, { storedAt: execution.storedAt, onResume }).catch(reject);
            });
        }
        finally {
            await workflow.expression.releaseIsolate();
        }
    }
};
exports.WaitingWebhooks = WaitingWebhooks;
exports.WaitingWebhooks = WaitingWebhooks = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, node_types_1.NodeTypes, execution_persistence_1.ExecutionPersistence, webhook_service_1.WebhookService, n8n_core_1.InstanceSettings, backend_services_1.EventService, config_1.EndpointsConfig])
], WaitingWebhooks);
//# sourceMappingURL=waiting-webhooks.js.map