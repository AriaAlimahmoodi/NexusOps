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
exports.LiveWebhooks = void 0;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const errors_1 = require("@n8n/errors");
const webhook_not_found_error_1 = require("../errors/response-errors/webhook-not-found.error");
const node_types_1 = require("../node-types");
const WebhookHelpers = __importStar(require("../webhooks/webhook-helpers"));
const webhook_service_1 = require("../webhooks/webhook.service");
const WorkflowExecuteAdditionalData = __importStar(require("../workflow-execute-additional-data"));
const backend_services_1 = require("@n8n/backend-services");
const workflow_publisher_service_1 = require("../workflows/workflow-publisher.service");
const workflow_static_data_service_1 = require("../workflows/workflow-static-data.service");
const constants_1 = require("./constants");
const node_type_matcher_1 = require("./node-type-matcher");
const webhook_request_sanitizer_1 = require("./webhook-request-sanitizer");
let LiveWebhooks = class LiveWebhooks {
    constructor(logger, nodeTypes, webhookService, workflowRepository, workflowStaticDataService, workflowsConfig, workflowPublishedDataService, expressionEngineConfig, workflowPublisherService) {
        this.logger = logger;
        this.nodeTypes = nodeTypes;
        this.webhookService = webhookService;
        this.workflowRepository = workflowRepository;
        this.workflowStaticDataService = workflowStaticDataService;
        this.workflowsConfig = workflowsConfig;
        this.workflowPublishedDataService = workflowPublishedDataService;
        this.expressionEngineConfig = expressionEngineConfig;
        this.workflowPublisherService = workflowPublisherService;
    }
    async getWebhookMethods(path) {
        return await this.webhookService.getWebhookMethods(path);
    }
    async findAccessControlOptions(path, httpMethod) {
        const webhook = await this.findWebhook(path, httpMethod);
        const workflowData = await this.workflowRepository.findOne({
            where: { id: webhook.workflowId },
            relations: { activeVersion: true },
        });
        const isChatWebhookNode = (type, webhookId) => type === n8n_workflow_1.CHAT_TRIGGER_NODE_TYPE && `${webhookId}/${n8n_workflow_1.CHAT_TRIGGER_PATH_SUFFIX}` === path;
        const nodes = workflowData?.activeVersion?.nodes;
        const webhookNode = nodes?.find(({ type, parameters, typeVersion, webhookId }) => (parameters?.path === path &&
            (parameters?.httpMethod ?? 'GET') === httpMethod &&
            'webhook' in this.nodeTypes.getByNameAndVersion(type, typeVersion)) ||
            isChatWebhookNode(type, webhookId));
        return webhookNode?.parameters?.options;
    }
    async executeWebhook(request, response, expectedNodeType) {
        const httpMethod = request.method;
        const path = request.params.path;
        this.logger.debug(`Received webhook "${httpMethod}" for path "${path}"`);
        request.params = {};
        const webhook = await this.findWebhook(path, httpMethod);
        response.locals.workflowId = webhook.workflowId;
        if (webhook.isDynamic) {
            const pathElements = path.split('/').slice(1);
            webhook.webhookPath.split('/').forEach((ele, index) => {
                if (ele.startsWith(':')) {
                    request.params[ele.slice(1)] = pathElements[index];
                }
            });
        }
        const { workflow: workflowData, publishedVersion } = await this.loadWebhookExecutionData(webhook.workflowId);
        const { nodes, connections, versionId } = publishedVersion;
        const activeWorkflowData = { ...workflowData, nodes, connections, versionId };
        const workflow = new n8n_workflow_1.Workflow({
            id: webhook.workflowId,
            name: workflowData.name,
            nodes,
            connections,
            active: workflowData.activeVersionId !== null,
            nodeTypes: this.nodeTypes,
            staticData: workflowData.staticData,
            settings: workflowData.settings,
        });
        const ownerProjectId = workflowData.shared?.find((share) => share.role === 'workflow:owner')?.projectId;
        const additionalData = await WorkflowExecuteAdditionalData.getBase({
            projectId: ownerProjectId,
            userId: await this.workflowPublisherService.findPublisherUserId(webhook.workflowId, versionId),
        });
        const startNode = workflow.getNode(webhook.node);
        if (this.webhookPhaseNeedsIsolate(startNode)) {
            await workflow.expression.acquireIsolate();
        }
        try {
            const webhookData = this.webhookService
                .getNodeWebhooks(workflow, startNode, additionalData)
                .find((w) => w.httpMethod === httpMethod && w.path === webhook.webhookPath);
            if (expectedNodeType &&
                !(0, node_type_matcher_1.matchesExpectedNodeType)(expectedNodeType, webhookData?.webhookDescription.nodeType)) {
                throw new webhook_not_found_error_1.WebhookNotFoundError({ path, httpMethod, webhookMethods: await this.getWebhookMethods(path) }, { hint: 'production' });
            }
            const workflowStartNode = workflow.getNode(webhookData.node);
            if (workflowStartNode === null) {
                throw new errors_1.NotFoundError('Could not find node to process webhook.');
            }
            if (!constants_1.authAllowlistedNodes.has(workflowStartNode.type)) {
                (0, webhook_request_sanitizer_1.sanitizeWebhookRequest)(request);
            }
            return await new Promise((resolve, reject) => {
                const executionMode = 'webhook';
                WebhookHelpers.executeWebhook(workflow, webhookData, activeWorkflowData, workflowStartNode, executionMode, undefined, undefined, undefined, request, response, async (error, data) => {
                    if (error !== null) {
                        return reject(error);
                    }
                    await this.workflowStaticDataService.saveStaticData(workflow);
                    resolve(data);
                }).catch(reject);
            });
        }
        finally {
            await workflow.expression.releaseIsolate();
        }
    }
    webhookPhaseNeedsIsolate(startNode) {
        if (!this.expressionEngineConfig.allowWebhookIsolateSkip)
            return true;
        if (startNode === null)
            return true;
        if (startNode.type !== n8n_workflow_1.WEBHOOK_NODE_TYPE)
            return true;
        if (startNode.typeVersion === 1)
            return true;
        if (!(0, n8n_workflow_1.nodeParametersAreStatic)(startNode))
            return true;
        const webhooks = this.nodeTypes.getByNameAndVersion(startNode.type, startNode.typeVersion)
            ?.description.webhooks;
        if (!webhooks?.length)
            return true;
        return !webhooks.every(n8n_workflow_1.webhookDescriptionIsNativelyResolvable);
    }
    async loadWebhookExecutionData(workflowId) {
        return this.workflowsConfig.useWorkflowPublicationService
            ? await this.loadFromPublishedVersion(workflowId)
            : await this.loadFromActiveVersion(workflowId);
    }
    async loadFromPublishedVersion(workflowId) {
        const publishedData = await this.workflowPublishedDataService.getPublishedWorkflowData(workflowId);
        if (publishedData === null) {
            throw new errors_1.NotFoundError(`Published version not found for workflow with id "${workflowId}"`);
        }
        return { workflow: publishedData.workflow, publishedVersion: publishedData.publishedVersion };
    }
    async loadFromActiveVersion(workflowId) {
        const workflowData = await this.workflowRepository.findOne({
            where: { id: workflowId },
            relations: { activeVersion: true, shared: true },
        });
        if (workflowData === null) {
            throw new errors_1.NotFoundError(`Could not find workflow with id "${workflowId}"`);
        }
        if (!workflowData.activeVersion) {
            throw new errors_1.NotFoundError(`Active version not found for workflow with id "${workflowId}"`);
        }
        return { workflow: workflowData, publishedVersion: workflowData.activeVersion };
    }
    async findWebhook(path, httpMethod) {
        if (path.endsWith('/')) {
            path = path.slice(0, -1);
        }
        const webhook = await this.webhookService.findWebhook(httpMethod, path);
        if (webhook === null) {
            const webhookMethods = await this.getWebhookMethods(path);
            throw new webhook_not_found_error_1.WebhookNotFoundError({ path, httpMethod, webhookMethods }, { hint: 'production' });
        }
        return webhook;
    }
};
exports.LiveWebhooks = LiveWebhooks;
exports.LiveWebhooks = LiveWebhooks = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, node_types_1.NodeTypes, webhook_service_1.WebhookService, db_1.WorkflowRepository, workflow_static_data_service_1.WorkflowStaticDataService, config_1.WorkflowsConfig, backend_services_1.WorkflowPublishedDataService, config_1.ExpressionEngineConfig, workflow_publisher_service_1.WorkflowPublisherService])
], LiveWebhooks);
//# sourceMappingURL=live-webhooks.js.map