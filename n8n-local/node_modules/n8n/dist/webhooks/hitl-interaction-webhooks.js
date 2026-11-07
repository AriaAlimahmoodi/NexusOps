"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HitlInteractionWebhooks = void 0;
const n8n_core_1 = require("n8n-core");
const waiting_webhooks_1 = require("./waiting-webhooks");
const webhook_request_sanitizer_1 = require("./webhook-request-sanitizer");
class HitlInteractionWebhooks extends waiting_webhooks_1.WaitingWebhooks {
    reject(res, status) {
        res.status(status).send('');
        return { noWebhookResponse: true };
    }
    handleUnrecognizedCallback(res) {
        return this.reject(res, 400);
    }
    beforeResume(_req) { }
    async validate(parsed) {
        if (!(0, n8n_core_1.verifyHitlCallbackReference)(parsed, this.instanceSettings.hmacSignatureSecret)) {
            return { ok: false, status: 404 };
        }
        const execution = await this.getExecution(parsed.executionId);
        if (!execution)
            return { ok: false, status: 404 };
        if (execution.status === 'running' ||
            execution.finished ||
            execution.data?.resultData?.error ||
            execution.data?.waitReason === 'suspended') {
            return { ok: false, status: 409 };
        }
        const lastNodeExecuted = execution.data.resultData.lastNodeExecuted;
        const workflow = this.createWorkflow(execution.workflowData);
        const node = workflow.getNode(lastNodeExecuted);
        if (!node)
            return { ok: false, status: 404 };
        if (node.type !== this.platformNodeType)
            return { ok: false, status: 404 };
        if (!node.id)
            return { ok: false, status: 404 };
        return {
            ok: true,
            value: { execution, executionId: parsed.executionId, lastNodeExecuted, nodeId: node.id },
        };
    }
    async executeWebhook(req, res) {
        (0, webhook_request_sanitizer_1.sanitizeWebhookRequest)(req);
        if (req.method !== 'POST')
            return this.reject(res, 404);
        const parsed = await this.parseCallback(req);
        if (!parsed)
            return this.handleUnrecognizedCallback(res);
        const validated = await this.validate(parsed);
        if (!validated.ok)
            return this.reject(res, validated.status);
        this.beforeResume(req);
        const { execution, executionId, lastNodeExecuted, nodeId } = validated.value;
        return await this.getWebhookExecutionData({
            execution,
            req,
            res,
            lastNodeExecuted,
            executionId,
            suffix: nodeId,
        });
    }
}
exports.HitlInteractionWebhooks = HitlInteractionWebhooks;
//# sourceMappingURL=hitl-interaction-webhooks.js.map