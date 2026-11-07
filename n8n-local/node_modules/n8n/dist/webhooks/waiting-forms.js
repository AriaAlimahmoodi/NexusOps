"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WaitingForms = void 0;
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const errors_1 = require("@n8n/errors");
const cors_util_1 = require("../utils/cors.util");
const waiting_webhooks_1 = require("../webhooks/waiting-webhooks");
const webhook_response_headers_1 = require("../webhooks/webhook-response-headers");
const constants_1 = require("./constants");
const webhook_request_sanitizer_1 = require("./webhook-request-sanitizer");
let WaitingForms = class WaitingForms extends waiting_webhooks_1.WaitingWebhooks {
    constructor() {
        super(...arguments);
        this.includeForms = true;
    }
    logReceivedWebhook(method, executionId) {
        this.logger.debug(`Received waiting-form "${method}" for execution "${executionId}"`);
    }
    disableNode(execution, method) {
        if (method === 'POST') {
            execution.data.executionData.nodeExecutionStack[0].node.disabled = true;
        }
    }
    findCompletionPage(workflow, runData, lastNodeExecuted) {
        const parentNodes = workflow.getParentNodes(lastNodeExecuted);
        const lastNode = workflow.nodes[lastNodeExecuted];
        if (!lastNode.disabled &&
            lastNode.type === n8n_workflow_1.FORM_NODE_TYPE &&
            lastNode.parameters.operation === 'completion') {
            return lastNodeExecuted;
        }
        else {
            return parentNodes.reverse().find((nodeName) => {
                const node = workflow.nodes[nodeName];
                return (!node.disabled &&
                    node.type === n8n_workflow_1.FORM_NODE_TYPE &&
                    node.parameters.operation === 'completion' &&
                    runData[nodeName]);
            });
        }
    }
    async executeWebhook(req, res) {
        const { path: executionId, suffix: routeSuffix } = req.params;
        this.logReceivedWebhook(req.method, executionId);
        req.params = {};
        const execution = await this.getExecution(executionId);
        const resumeNodeName = execution?.data?.resultData?.lastNodeExecuted;
        const resumeNodeType = resumeNodeName
            ? execution?.workflowData?.nodes?.find((n) => n.name === resumeNodeName)?.type
            : undefined;
        if (!resumeNodeType || !constants_1.authAllowlistedNodes.has(resumeNodeType)) {
            (0, webhook_request_sanitizer_1.sanitizeWebhookRequest)(req);
        }
        let webhookPath;
        if (execution?.data.resumeToken) {
            const result = this.validateToken(req, execution);
            if (!result.valid) {
                (0, webhook_response_headers_1.applyFormSandboxCSP)(res);
                res.status(401).render('form-invalid-token');
                return { noWebhookResponse: true };
            }
            webhookPath = result.webhookPath;
        }
        const suffix = routeSuffix ?? webhookPath;
        const statusResult = this.handleStatusRequest(execution, suffix, req, res);
        if (statusResult)
            return statusResult;
        if (!execution) {
            throw new errors_1.NotFoundError(`The execution "${executionId}" does not exist.`);
        }
        if (execution.data.resultData.error) {
            const message = `The execution "${executionId}" has finished with error.`;
            this.logger.debug(message, { error: execution.data.resultData.error });
            throw new errors_1.ConflictError(message);
        }
        if (execution.status === 'running' || execution.data.waitReason === 'suspended') {
            return { noWebhookResponse: true };
        }
        let lastNodeExecuted = execution.data.resultData.lastNodeExecuted;
        if (execution.finished) {
            const workflow = this.createWorkflow(execution.workflowData);
            const completionPage = this.findCompletionPage(workflow, execution.data.resultData.runData, lastNodeExecuted);
            if (!completionPage) {
                (0, webhook_response_headers_1.applyFormSandboxCSP)(res);
                res.render('form-trigger-completion', {
                    title: 'Form Submitted',
                    message: 'Your response has been recorded',
                    formTitle: 'Form Submitted',
                });
                return { noWebhookResponse: true };
            }
            lastNodeExecuted = completionPage;
        }
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
    handleStatusRequest(execution, suffix, req, res) {
        if (suffix !== n8n_workflow_1.WAITING_FORMS_EXECUTION_STATUS)
            return undefined;
        let status = execution?.status ?? 'null';
        const { node } = execution?.data.executionData?.nodeExecutionStack[0] ?? {};
        const isParked = execution?.data.waitReason === 'suspended';
        if (node && status === 'waiting' && !isParked && this.isFormResumeNode(node)) {
            status = 'form-waiting';
        }
        (0, cors_util_1.applyCors)(req, res);
        res.send(status);
        return { noWebhookResponse: true };
    }
};
exports.WaitingForms = WaitingForms;
exports.WaitingForms = WaitingForms = __decorate([
    (0, di_1.Service)()
], WaitingForms);
//# sourceMappingURL=waiting-forms.js.map