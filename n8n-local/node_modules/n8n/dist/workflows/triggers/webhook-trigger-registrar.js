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
exports.WebhookTriggerRegistrar = void 0;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const n8n_workflow_1 = require("n8n-workflow");
const n8n_core_1 = require("n8n-core");
const WebhookHelpers = __importStar(require("../../webhooks/webhook-helpers"));
const webhook_service_1 = require("../../webhooks/webhook.service");
const workflow_static_data_service_1 = require("../../workflows/workflow-static-data.service");
function hasErrorDetail(error) {
    return (error instanceof Error && typeof error.detail === 'string');
}
function isQueryFailedError(error) {
    return error instanceof Error && error.name === 'QueryFailedError';
}
let WebhookTriggerRegistrar = class WebhookTriggerRegistrar {
    constructor(logger, errorReporter, webhookService, workflowStaticDataService, tracing) {
        this.logger = logger;
        this.errorReporter = errorReporter;
        this.webhookService = webhookService;
        this.workflowStaticDataService = workflowStaticDataService;
        this.tracing = tracing;
        this.logger = this.logger.scoped('workflow-publication');
    }
    getWebhookTriggers(workflow, additionalData) {
        return WebhookHelpers.getWorkflowWebhooks(workflow, additionalData, undefined, true);
    }
    getNodeWebhookTriggers(workflow, node, additionalData) {
        return this.webhookService.getNodeWebhooks(workflow, node, additionalData, true);
    }
    async register({ workflow, webhookData, mode, activation }) {
        await this.tracing.startSpan({
            name: 'Webhook trigger register',
            op: 'publication.webhook.register',
            attributes: {
                ...this.tracing.pickWorkflowAttributes({ id: workflow.id, name: workflow.name }),
                ...this.tracing.pickNodeAttributes({ name: webhookData.node }),
                'n8n.webhook.path': webhookData.path,
                'n8n.webhook.method': webhookData.httpMethod,
            },
        }, async (span) => {
            const webhook = this.buildNormalizedWebhook(workflow, webhookData);
            let isStored = false;
            try {
                await this.webhookService.storeWebhook(webhook);
                isStored = true;
                await this.webhookService.createWebhookIfNotExists(workflow, webhookData, mode, activation);
            }
            catch (error) {
                if (isStored)
                    await this.clearRegisteredWebhook(workflow, webhookData);
                if (isQueryFailedError(error)) {
                    throw new n8n_workflow_1.WebhookPathTakenError(webhook.node, error);
                }
                if (hasErrorDetail(error)) {
                    error.message = error.detail;
                }
                throw error;
            }
            this.logger.debug(`Added webhook "${webhookData.node}" for workflow "${workflow.name}"`, {
                workflowId: workflow.id,
                nodeName: webhookData.node,
            });
            span.setStatus({ code: 1 });
        });
    }
    async deregister({ workflow, webhookData }) {
        return await this.tracing.startSpan({
            name: 'Webhook trigger deregister',
            op: 'publication.webhook.deregister',
            attributes: {
                ...this.tracing.pickWorkflowAttributes({ id: workflow.id, name: workflow.name }),
                ...this.tracing.pickNodeAttributes({ name: webhookData.node }),
            },
        }, async (span) => {
            await this.webhookService.deleteWebhook(workflow, webhookData, 'internal', 'update');
            this.logger.debug(`Deactivating webhook "${webhookData.node}" for workflow "${workflow.name}"`, {
                workflow: { id: workflow.id, name: workflow.name },
                node: { name: webhookData.node, webhookId: webhookData.webhookId },
            });
            span.setStatus({ code: 1 });
            return webhookData.node;
        });
    }
    async clearWorkflowWebhooksForNodes(workflowId, nodeNames) {
        await this.webhookService.deleteWorkflowWebhooksForNodes(workflowId, nodeNames);
    }
    async getNodesWithUnregisteredWebhooks(workflow, additionalData, desiredNodes) {
        const ownsIsolate = await workflow.expression.acquireIsolate();
        try {
            const desiredWebhooks = this.getWebhookTriggers(workflow, additionalData).filter((webhookData) => desiredNodes.has(workflow.getNode(webhookData.node)?.id ?? ''));
            if (desiredWebhooks.length === 0) {
                return new Set();
            }
            const registeredKeys = new Set((await this.webhookService.getRegisteredWebhooks(workflow.id)).map((webhook) => this.buildWebhookKey(webhook.method, webhook.webhookPath)));
            const unregistered = new Set();
            for (const webhookData of desiredWebhooks) {
                const node = workflow.getNode(webhookData.node);
                if (!node) {
                    continue;
                }
                const webhook = this.buildNormalizedWebhook(workflow, webhookData);
                const key = this.buildWebhookKey(webhook.method, webhook.webhookPath);
                if (!registeredKeys.has(key)) {
                    unregistered.add(node.id);
                }
            }
            return unregistered;
        }
        finally {
            if (ownsIsolate)
                await workflow.expression.releaseIsolate();
        }
    }
    buildNormalizedWebhook(workflow, webhookData) {
        const node = workflow.getNode(webhookData.node);
        const webhook = this.webhookService.createWebhook({
            workflowId: webhookData.workflowId,
            webhookPath: webhookData.path,
            node: node.name,
            method: webhookData.httpMethod,
        }, node.webhookId);
        return webhook;
    }
    buildWebhookKey(method, webhookPath) {
        return `${method} ${webhookPath}`;
    }
    async clearRegisteredWebhook(workflow, webhookData) {
        try {
            await this.deregister({ workflow, webhookData });
            await this.workflowStaticDataService.saveStaticData(workflow);
            await this.clearWorkflowWebhooksForNodes(workflow.id, [webhookData.node]);
        }
        catch (clearError) {
            const error = (0, ensure_error_1.ensureError)(clearError);
            this.errorReporter.error(error);
            this.logger.error(`Could not remove webhook "${webhookData.node}" of workflow "${workflow.id}" because of error: "${error.message}"`);
        }
    }
};
exports.WebhookTriggerRegistrar = WebhookTriggerRegistrar;
exports.WebhookTriggerRegistrar = WebhookTriggerRegistrar = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, n8n_core_1.ErrorReporter, webhook_service_1.WebhookService, workflow_static_data_service_1.WorkflowStaticDataService, n8n_core_1.Tracing])
], WebhookTriggerRegistrar);
//# sourceMappingURL=webhook-trigger-registrar.js.map