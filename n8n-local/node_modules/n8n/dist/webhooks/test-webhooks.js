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
exports.TestWebhooks = void 0;
const backend_common_1 = require("@n8n/backend-common");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const constants_1 = require("../constants");
const errors_1 = require("@n8n/errors");
const webhook_not_found_error_1 = require("../errors/response-errors/webhook-not-found.error");
const single_webhook_trigger_error_1 = require("../errors/single-webhook-trigger.error");
const workflow_missing_id_error_1 = require("../errors/workflow-missing-id.error");
const node_types_1 = require("../node-types");
const push_1 = require("../push");
const publisher_service_1 = require("../scaling/pubsub/publisher.service");
const utils_1 = require("../utils");
const test_webhook_registrations_service_1 = require("../webhooks/test-webhook-registrations.service");
const WebhookHelpers = __importStar(require("../webhooks/webhook-helpers"));
const WorkflowExecuteAdditionalData = __importStar(require("../workflow-execute-additional-data"));
const constants_2 = require("./constants");
const node_type_matcher_1 = require("./node-type-matcher");
const webhook_request_sanitizer_1 = require("./webhook-request-sanitizer");
const webhook_service_1 = require("./webhook.service");
const SINGLE_WEBHOOK_TRIGGERS = [
    'n8n-nodes-base.telegramTrigger',
    'n8n-nodes-base.slackTrigger',
    'n8n-nodes-base.facebookLeadAdsTrigger',
];
let TestWebhooks = class TestWebhooks {
    constructor(logger, push, nodeTypes, registrations, instanceSettings, publisher, webhookService, executionContextService) {
        this.logger = logger;
        this.push = push;
        this.nodeTypes = nodeTypes;
        this.registrations = registrations;
        this.instanceSettings = instanceSettings;
        this.publisher = publisher;
        this.webhookService = webhookService;
        this.executionContextService = executionContextService;
        this.timeouts = {};
    }
    async executeWebhook(request, response, expectedNodeType) {
        const httpMethod = request.method;
        let path = (0, utils_1.removeTrailingSlash)(request.params.path);
        request.params = {};
        let webhook = await this.getActiveWebhook(httpMethod, path);
        if (!webhook) {
            const [webhookId, ...segments] = path.split('/');
            webhook = await this.getActiveWebhook(httpMethod, segments.join('/'), webhookId);
            if (!webhook)
                throw new webhook_not_found_error_1.WebhookNotFoundError({
                    path,
                    httpMethod,
                    webhookMethods: await this.getWebhookMethods(path),
                });
            path = webhook.path;
            path.split('/').forEach((segment, index) => {
                if (segment.startsWith(':')) {
                    request.params[segment.slice(1)] = segments[index];
                }
            });
        }
        if (expectedNodeType &&
            !(0, node_type_matcher_1.matchesExpectedNodeType)(expectedNodeType, webhook.webhookDescription.nodeType)) {
            throw new webhook_not_found_error_1.WebhookNotFoundError({
                path,
                httpMethod,
                webhookMethods: await this.getWebhookMethods(path),
            });
        }
        const key = this.registrations.toKey(webhook);
        const registration = await this.registrations.get(key);
        if (!registration) {
            throw new webhook_not_found_error_1.WebhookNotFoundError({
                path,
                httpMethod,
                webhookMethods: await this.getWebhookMethods(path),
            });
        }
        const { pushRef, workflowEntity, webhook: testWebhook, destinationNode, encryptedRunnerIdentity, } = registration;
        const workflow = this.toWorkflow(workflowEntity);
        if (testWebhook.staticData)
            workflow.setTestStaticData(testWebhook.staticData);
        const workflowStartNode = workflow.getNode(webhook.node);
        if (workflowStartNode === null) {
            throw new errors_1.NotFoundError('Could not find node to process webhook.');
        }
        if (!constants_2.authAllowlistedNodes.has(workflowStartNode.type)) {
            (0, webhook_request_sanitizer_1.sanitizeWebhookRequest)(request);
        }
        await workflow.expression.acquireIsolate();
        return await new Promise(async (resolve, reject) => {
            try {
                try {
                    const executionMode = 'manual';
                    const executionId = await WebhookHelpers.executeWebhook(workflow, webhook, workflowEntity, workflowStartNode, executionMode, pushRef, undefined, undefined, request, response, (error, data) => {
                        if (error !== null)
                            reject(error);
                        else
                            resolve(data);
                    }, destinationNode, { encryptedRunnerIdentity });
                    if (executionId === undefined) {
                        return;
                    }
                    if (pushRef !== undefined) {
                        this.push.send({
                            type: 'testWebhookReceived',
                            data: { workflowId: webhook?.workflowId, executionId },
                        }, pushRef);
                    }
                }
                catch (error) {
                    reject(error);
                }
                if (this.instanceSettings.isMultiMain && pushRef && !this.push.hasPushRef(pushRef)) {
                    void this.publisher.publishCommand({
                        command: 'clear-test-webhooks',
                        payload: { webhookKey: key, workflowEntity, pushRef },
                    });
                    return;
                }
                this.clearTimeout(key);
                await this.deactivateWebhooks(workflow);
            }
            finally {
                try {
                    await workflow.expression.releaseIsolate();
                }
                catch (error) {
                    this.logger.error('Failed to release expression isolate for test webhook', {
                        error,
                        workflowId: workflow.id,
                    });
                }
            }
        });
    }
    async handleClearTestWebhooks({ webhookKey, workflowEntity, pushRef, }) {
        if (!this.push.hasPushRef(pushRef))
            return;
        this.clearTimeout(webhookKey);
        const workflow = this.toWorkflow(workflowEntity);
        await workflow.expression.acquireIsolate();
        try {
            await this.deactivateWebhooks(workflow);
        }
        finally {
            await workflow.expression.releaseIsolate();
        }
    }
    clearTimeout(key) {
        const timeout = this.timeouts[key];
        if (timeout)
            clearTimeout(timeout);
    }
    async getRegistrationsFromPath(rawPath) {
        const path = (0, utils_1.removeTrailingSlash)(rawPath);
        const found = [];
        const registrations = await this.registrations.getRegistrationsHash();
        for (const httpMethod of ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']) {
            const key = this.registrations.toKey({ httpMethod, path });
            let registration = registrations?.[key];
            if (!registration) {
                const [webhookId, ...segments] = path.split('/');
                const key = this.registrations.toKey({ httpMethod, path, webhookId });
                const candidate = registrations?.[key];
                if (candidate && this.getActiveWebhookFromRegistration(segments.join('/'), candidate)) {
                    registration = candidate;
                }
            }
            if (registration) {
                found.push(registration);
            }
        }
        return found;
    }
    async getWebhooksFromPath(rawPath) {
        const registrations = await this.getRegistrationsFromPath(rawPath);
        return registrations.map((registration) => registration.webhook);
    }
    async getWebhookMethods(rawPath) {
        const path = (0, utils_1.removeTrailingSlash)(rawPath);
        const webhooks = await this.getWebhooksFromPath(path);
        const webhookMethods = webhooks.map((webhook) => webhook.httpMethod);
        if (!webhookMethods.length)
            throw new webhook_not_found_error_1.WebhookNotFoundError({ path });
        return webhookMethods;
    }
    async findAccessControlOptions(path, httpMethod) {
        const allKeys = await this.registrations.getAllKeys();
        const webhookKey = allKeys.find((key) => key.includes(path) && key.startsWith(httpMethod));
        if (!webhookKey)
            return;
        const registration = await this.registrations.get(webhookKey);
        if (!registration)
            return;
        const { workflowEntity } = registration;
        const workflow = this.toWorkflow(workflowEntity);
        const webhookNode = Object.values(workflow.nodes).find(({ type, parameters, typeVersion }) => parameters?.path === path &&
            (parameters?.httpMethod ?? 'GET') === httpMethod &&
            'webhook' in this.nodeTypes.getByNameAndVersion(type, typeVersion));
        return webhookNode?.parameters?.options;
    }
    establishesRunnerIdentity(workflow, nodeName) {
        const node = workflow.nodes[nodeName];
        if (node?.type !== n8n_workflow_1.CHAT_TRIGGER_NODE_TYPE)
            return false;
        return (0, n8n_workflow_1.classifyTriggerIdentity)(node.type, node.parameters).providesN8nIdentity;
    }
    async mintRunnerIdentity(workflow, webhooks, n8nAuthCookie) {
        if (!n8nAuthCookie)
            return undefined;
        const anyEstablishesIdentity = webhooks.some((webhook) => this.establishesRunnerIdentity(workflow, webhook.node));
        if (!anyEstablishesIdentity)
            return undefined;
        return await this.executionContextService.buildManualExecutionCredentials(n8nAuthCookie);
    }
    async needsWebhook(options) {
        const { userId, workflowEntity, additionalData, runData, pushRef, destinationNode, triggerToStartFrom, chatSessionId, workflowIsActive, n8nAuthCookie, timeoutMs, } = options;
        if (!workflowEntity.id)
            throw new workflow_missing_id_error_1.WorkflowMissingIdError(workflowEntity);
        const workflow = this.toWorkflow(workflowEntity);
        await workflow.expression.acquireIsolate();
        let webhooks;
        try {
            webhooks = WebhookHelpers.getWorkflowWebhooks(workflow, additionalData, destinationNode, true);
            if (triggerToStartFrom?.data) {
                return false;
            }
            if (triggerToStartFrom) {
                webhooks = webhooks.filter((w) => w.node === triggerToStartFrom.name);
            }
            if (!webhooks.some((w) => w.webhookDescription.restartWebhook !== true)) {
                return false;
            }
            const timeoutDuration = timeoutMs !== undefined && timeoutMs > 0
                ? Math.min(timeoutMs, constants_1.TEST_WEBHOOK_MAX_TIMEOUT)
                : constants_1.TEST_WEBHOOK_TIMEOUT;
            const registrationTtl = timeoutDuration + constants_1.TEST_WEBHOOK_TIMEOUT_BUFFER;
            if (workflowIsActive) {
                const singleWebhookTrigger = webhooks.find((w) => SINGLE_WEBHOOK_TRIGGERS.includes(workflow.getNode(w.node)?.type ?? ''));
                if (singleWebhookTrigger) {
                    throw new single_webhook_trigger_error_1.SingleWebhookTriggerError(workflow.getNode(singleWebhookTrigger.node)?.name ?? '');
                }
            }
            const timeout = setTimeout(async () => await this.cancelWebhook(workflow.id), timeoutDuration);
            const encryptedRunnerIdentity = await this.mintRunnerIdentity(workflow, webhooks, n8nAuthCookie);
            for (const webhook of webhooks) {
                webhook.path = (0, utils_1.removeTrailingSlash)(webhook.path);
                if (chatSessionId &&
                    webhook.node &&
                    workflow.nodes[webhook.node]?.type === n8n_workflow_1.CHAT_TRIGGER_NODE_TYPE) {
                    webhook.path = `${workflow.id}/${chatSessionId}`;
                    webhook.isChatSessionTest = true;
                }
                const key = this.registrations.toKey(webhook);
                const registrationByKey = await this.registrations.get(key);
                if (runData && webhook.node in runData) {
                    return false;
                }
                if (registrationByKey &&
                    !webhook.webhookId &&
                    !registrationByKey.webhook.isTest &&
                    registrationByKey.webhook.userId !== userId &&
                    registrationByKey.webhook.workflowId !== workflow.id) {
                    throw new n8n_workflow_1.WebhookPathTakenError(webhook.node);
                }
                webhook.isTest = true;
                const { workflowExecuteAdditionalData: _, ...cacheableWebhook } = webhook;
                cacheableWebhook.userId = userId;
                const registration = {
                    version: 1,
                    pushRef,
                    workflowEntity,
                    destinationNode,
                    webhook: cacheableWebhook,
                    encryptedRunnerIdentity: this.establishesRunnerIdentity(workflow, webhook.node)
                        ? encryptedRunnerIdentity
                        : undefined,
                };
                try {
                    await this.registrations.register(registration, registrationTtl);
                    await this.webhookService.createWebhookIfNotExists(workflow, webhook, 'manual', 'manual');
                    cacheableWebhook.staticData = workflow.staticData;
                    await this.registrations.register(registration, registrationTtl);
                    if (this.timeouts[key] !== timeout)
                        this.clearTimeout(key);
                    this.timeouts[key] = timeout;
                }
                catch (error) {
                    await this.deactivateWebhooks(workflow);
                    delete this.timeouts[key];
                    throw error;
                }
            }
            return true;
        }
        finally {
            await workflow.expression.releaseIsolate();
        }
    }
    async cancelWebhook(workflowId) {
        let foundWebhook = false;
        const allWebhookKeys = await this.registrations.getAllKeys();
        for (const key of allWebhookKeys) {
            const registration = await this.registrations.get(key);
            if (!registration)
                continue;
            const { pushRef, workflowEntity } = registration;
            const workflow = this.toWorkflow(workflowEntity);
            if (workflowEntity.id !== workflowId)
                continue;
            this.clearTimeout(key);
            if (pushRef !== undefined) {
                try {
                    this.push.send({ type: 'testWebhookDeleted', data: { workflowId } }, pushRef);
                }
                catch {
                }
            }
            if (!foundWebhook) {
                void (async () => {
                    await workflow.expression.acquireIsolate();
                    try {
                        await this.deactivateWebhooks(workflow);
                    }
                    finally {
                        await workflow.expression.releaseIsolate();
                    }
                })().catch((error) => {
                    this.logger.error('Failed to deactivate test webhooks on cancel', {
                        error,
                        workflowId,
                    });
                });
            }
            foundWebhook = true;
        }
        return foundWebhook;
    }
    getActiveWebhookFromRegistration(path, registration) {
        const pathElementsSet = new Set(path.split('/'));
        const { webhook: dynamicWebhook } = registration;
        const staticElements = dynamicWebhook.path.split('/').filter((ele) => !ele.startsWith(':'));
        const allStaticExist = staticElements.every((staticEle) => pathElementsSet.has(staticEle));
        if ((allStaticExist && staticElements.length > 0) || staticElements.length === 0) {
            return dynamicWebhook;
        }
        return undefined;
    }
    async getActiveWebhook(httpMethod, path, webhookId) {
        const key = this.registrations.toKey({ httpMethod, path, webhookId });
        const registration = await this.registrations.get(key);
        if (!registration)
            return;
        return this.getActiveWebhookFromRegistration(path, registration);
    }
    async deactivateWebhooks(workflow) {
        const allRegistrations = await this.registrations.getAllRegistrations();
        if (!allRegistrations.length)
            return;
        const webhooksByWorkflow = allRegistrations.reduce((acc, cur) => {
            const { workflowId } = cur.webhook;
            acc[workflowId] ||= [];
            acc[workflowId].push(cur.webhook);
            return acc;
        }, {});
        const webhooks = webhooksByWorkflow[workflow.id];
        if (!webhooks)
            return;
        for (const webhook of webhooks) {
            const { userId, staticData } = webhook;
            if (userId) {
                webhook.workflowExecuteAdditionalData = await WorkflowExecuteAdditionalData.getBase({
                    userId,
                    workflowId: workflow.id,
                });
            }
            if (staticData)
                workflow.staticData = staticData;
            await this.webhookService.deleteWebhook(workflow, webhook, 'internal', 'update');
            await this.registrations.deregister(webhook);
        }
    }
    toWorkflow(workflowEntity) {
        return new n8n_workflow_1.Workflow({
            id: workflowEntity.id,
            name: workflowEntity.name,
            nodes: workflowEntity.nodes,
            connections: workflowEntity.connections,
            active: false,
            nodeTypes: this.nodeTypes,
            staticData: {},
            settings: workflowEntity.settings,
        });
    }
};
exports.TestWebhooks = TestWebhooks;
__decorate([
    (0, decorators_1.OnPubSubEvent)('clear-test-webhooks', { instanceType: 'main' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TestWebhooks.prototype, "handleClearTestWebhooks", null);
exports.TestWebhooks = TestWebhooks = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, push_1.Push, node_types_1.NodeTypes, test_webhook_registrations_service_1.TestWebhookRegistrationsService, n8n_core_1.InstanceSettings, publisher_service_1.Publisher, webhook_service_1.WebhookService, n8n_core_1.ExecutionContextService])
], TestWebhooks);
//# sourceMappingURL=test-webhooks.js.map