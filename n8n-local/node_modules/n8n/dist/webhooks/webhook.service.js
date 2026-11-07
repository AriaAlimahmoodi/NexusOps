"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const node_types_1 = require("../node-types");
const backend_services_1 = require("@n8n/backend-services");
let WebhookService = class WebhookService {
    constructor(logger, webhookRepository, cacheService, nodeTypes) {
        this.logger = logger;
        this.webhookRepository = webhookRepository;
        this.cacheService = cacheService;
        this.nodeTypes = nodeTypes;
    }
    async populateCache() {
        const staticWebhooks = await this.webhookRepository.getStaticWebhooks();
        if (staticWebhooks.length === 0)
            return;
        void this.cacheService.setMany(staticWebhooks.map((w) => [w.cacheKey, w]));
    }
    async findAll() {
        return await this.webhookRepository.find();
    }
    async findCached(method, path) {
        const staticWebhook = await this.findCachedStaticWebhook(method, path);
        if (staticWebhook)
            return staticWebhook;
        return await this.findDynamicWebhook(path, method);
    }
    async findCachedStaticWebhook(method, path) {
        const cacheKey = `webhook:${method}-${path}`;
        let cachedStaticWebhook;
        try {
            cachedStaticWebhook = await this.cacheService.get(cacheKey);
        }
        catch (error) {
            this.logger.warn('Failed to query webhook cache', {
                error: (0, ensure_error_1.ensureError)(error).message,
            });
            cachedStaticWebhook = undefined;
        }
        if (cachedStaticWebhook) {
            const entity = this.webhookRepository.create(cachedStaticWebhook);
            return entity.isDynamic ? null : entity;
        }
        const dbStaticWebhook = await this.findStaticWebhookInDb(method, path);
        if (dbStaticWebhook) {
            void this.cacheService.set(cacheKey, dbStaticWebhook).catch((error) => {
                this.logger.warn('Failed to cache webhook', {
                    error: (0, ensure_error_1.ensureError)(error).message,
                });
            });
        }
        return dbStaticWebhook;
    }
    async findStaticWebhookInDb(method, path) {
        const webhook = await this.webhookRepository.findOneBy({ webhookPath: path, method });
        return webhook?.isDynamic ? null : webhook;
    }
    async findStaticWebhook(method, path) {
        return await this.findCachedStaticWebhook(method, path);
    }
    async findTriggerWebhooksByPath(path, method) {
        const staticWebhooks = await this.webhookRepository.findStaticWebhooksByPath(path);
        if (method) {
            const staticMatch = staticWebhooks.find((webhook) => webhook.method === method);
            if (staticMatch)
                return this.rowsOfSameTrigger(staticWebhooks, staticMatch);
            return await this.findDynamicTriggerWebhooks(path, method);
        }
        const candidates = [...staticWebhooks, ...(await this.findDynamicTriggerWebhooks(path))];
        const [first] = candidates;
        if (!first)
            return [];
        const oneTrigger = this.rowsOfSameTrigger(candidates, first);
        return oneTrigger.length === candidates.length ? oneTrigger : [];
    }
    async findDynamicTriggerWebhooks(path, method) {
        const [uuidSegment, ...otherSegments] = path.split('/');
        const candidates = await this.webhookRepository.findDynamicWebhooksByWebhookId(uuidSegment, otherSegments.length);
        const eligible = method ? candidates.filter((dw) => dw.method === method) : candidates;
        const match = this.pickMatchingTemplate(eligible, new Set(otherSegments));
        return match ? this.rowsOfSameTrigger(candidates, match) : [];
    }
    rowsOfSameTrigger(webhooks, row) {
        return webhooks.filter((webhook) => webhook.workflowId === row.workflowId &&
            webhook.node === row.node &&
            webhook.webhookPath === row.webhookPath);
    }
    pickMatchingTemplate(candidates, requestSegments) {
        const { webhook } = candidates.reduce((acc, dw) => {
            const allStaticSegmentsMatch = dw.staticSegments.every((s) => requestSegments.has(s));
            if (allStaticSegmentsMatch && dw.staticSegments.length > acc.maxMatches) {
                acc.maxMatches = dw.staticSegments.length;
                acc.webhook = dw;
            }
            else if (dw.staticSegments.length === 0 && !acc.webhook) {
                acc.webhook = dw;
            }
            return acc;
        }, { webhook: null, maxMatches: 0 });
        return webhook ?? undefined;
    }
    async findDynamicWebhook(path, method) {
        const [uuidSegment, ...otherSegments] = path.split('/');
        const dynamicWebhooks = await this.webhookRepository.findBy({
            webhookId: uuidSegment,
            method,
            pathLength: otherSegments.length,
        });
        if (dynamicWebhooks.length === 0)
            return null;
        return this.pickMatchingTemplate(dynamicWebhooks, new Set(otherSegments)) ?? null;
    }
    async findWebhook(method, path) {
        return await this.findCached(method, path);
    }
    async storeWebhook(webhook) {
        try {
            await this.webhookRepository.insert(webhook);
        }
        catch (error) {
            const existing = await this.webhookRepository.findOneBy({
                method: webhook.method,
                webhookPath: webhook.webhookPath,
            });
            if (!existing)
                throw error;
            if (existing.workflowId !== webhook.workflowId) {
                throw new n8n_workflow_1.WebhookPathTakenError(webhook.node, (0, ensure_error_1.ensureError)(error));
            }
            await this.webhookRepository.update({ method: webhook.method, webhookPath: webhook.webhookPath }, webhook);
        }
        try {
            await this.cacheService.set(webhook.cacheKey, webhook);
        }
        catch (error) {
            this.logger.warn('Failed to cache webhook', {
                error: (0, ensure_error_1.ensureError)(error).message,
            });
        }
    }
    createWebhook(data, nodeWebhookId) {
        const webhook = this.webhookRepository.create(data);
        webhook.webhookPath = this.normalizeWebhookPath(webhook.webhookPath);
        if (this.isDynamicWebhookPath(webhook.webhookPath) && nodeWebhookId) {
            webhook.webhookId = nodeWebhookId;
            webhook.pathLength = webhook.webhookPath.split('/').length;
        }
        return webhook;
    }
    normalizeWebhookPath(path) {
        let normalizedPath = path.trim();
        if (normalizedPath.startsWith('/'))
            normalizedPath = normalizedPath.slice(1);
        if (normalizedPath.endsWith('/'))
            normalizedPath = normalizedPath.slice(0, -1);
        return normalizedPath;
    }
    isDynamicWebhookPath(path) {
        return path.startsWith(':') || path.includes('/:');
    }
    async getRegisteredWebhooks(workflowId) {
        return await this.webhookRepository.findBy({ workflowId });
    }
    async deleteWorkflowWebhooks(workflowId) {
        const webhooks = await this.webhookRepository.findBy({ workflowId });
        return await this.deleteWebhooks(webhooks);
    }
    async deleteWorkflowWebhooksForNodes(workflowId, nodeNames) {
        if (nodeNames.length === 0)
            return;
        const webhooks = await this.webhookRepository.findBy({ workflowId });
        const toDelete = webhooks.filter((webhook) => nodeNames.includes(webhook.node));
        return await this.deleteWebhooks(toDelete);
    }
    async deleteWebhooks(webhooks) {
        void this.cacheService.deleteMany(webhooks.map((w) => w.cacheKey));
        return await this.webhookRepository.remove(webhooks);
    }
    async getWebhookMethods(rawPath) {
        const staticMethods = await this.webhookRepository
            .find({ select: ['method'], where: { webhookPath: rawPath } })
            .then((rows) => rows.map((r) => r.method));
        if (staticMethods.length > 0) {
            return staticMethods;
        }
        const dynamicWebhooks = await this.findDynamicWebhook(rawPath);
        return dynamicWebhooks ? [dynamicWebhooks.method] : [];
    }
    isDynamicPath(rawPath) {
        const firstSlashIndex = rawPath.indexOf('/');
        const path = firstSlashIndex !== -1 ? rawPath.substring(firstSlashIndex + 1) : rawPath;
        if (path === '' || path === ':' || path === '/:')
            return false;
        return path.startsWith(':') || path.includes('/:');
    }
    getWebhookPath(webhook) {
        return [webhook.path.includes(':') ? webhook.webhookId : undefined, webhook.path]
            .filter((part) => !!part)
            .join('/');
    }
    getStaticWebhookKeys(nodes) {
        return nodes.flatMap((node) => {
            if (node.disabled === true || node.webhookId === undefined)
                return [];
            const { description } = this.nodeTypes.getByNameAndVersion(node.type, node.typeVersion);
            const webhooks = description.webhooks?.filter(({ isFullPath }) => isFullPath === true);
            if (!webhooks?.length)
                return [];
            const parameters = n8n_workflow_1.NodeHelpers.getNodeParameters(description.properties, node.parameters, true, false, node, description) ?? {};
            const { path, httpMethod } = parameters;
            if (typeof path !== 'string' || path.startsWith('='))
                return [];
            const webhookPath = this.normalizeWebhookPath(path);
            if (webhookPath === '' || this.isDynamicWebhookPath(webhookPath))
                return [];
            return [httpMethod]
                .flat()
                .filter((method) => typeof method === 'string')
                .map((method) => `${method} ${webhookPath}`);
        });
    }
    getNodeWebhooks(workflow, node, additionalData, ignoreRestartWebhooks = false) {
        if (node.disabled === true) {
            return [];
        }
        const nodeType = this.nodeTypes.getByNameAndVersion(node.type, node.typeVersion);
        if (nodeType.description.webhooks === undefined) {
            return [];
        }
        const workflowId = workflow.id || '__UNSAVED__';
        const returnData = [];
        for (const webhookDescription of nodeType.description.webhooks) {
            if (ignoreRestartWebhooks && webhookDescription.restartWebhook === true) {
                continue;
            }
            let nodeWebhookPath = this.evaluateDescriptionProperty(workflow, node, webhookDescription, 'path');
            if (nodeWebhookPath === undefined || nodeWebhookPath === null) {
                this.logger.error(`No webhook path could be found for node "${node.name}" in workflow "${workflowId}".`);
                continue;
            }
            nodeWebhookPath = nodeWebhookPath.toString().trim();
            if (nodeWebhookPath.startsWith('/')) {
                nodeWebhookPath = nodeWebhookPath.slice(1);
            }
            if (nodeWebhookPath.endsWith('/')) {
                nodeWebhookPath = nodeWebhookPath.slice(0, -1);
            }
            const isFullPath = this.evaluateDescriptionProperty(workflow, node, webhookDescription, 'isFullPath', false);
            const restartWebhook = this.evaluateDescriptionProperty(workflow, node, webhookDescription, 'restartWebhook', false);
            const path = n8n_workflow_1.NodeHelpers.getNodeWebhookPath(workflowId, node, nodeWebhookPath, isFullPath, restartWebhook);
            const webhookMethods = this.evaluateDescriptionProperty(workflow, node, webhookDescription, 'httpMethod', 'GET');
            if (webhookMethods === undefined) {
                this.logger.error(`The webhook "${path}" for node "${node.name}" in workflow "${workflowId}" could not be added because the httpMethod is not defined.`);
                continue;
            }
            let webhookId;
            if (this.isDynamicPath(path) && node.webhookId) {
                webhookId = node.webhookId;
            }
            String(webhookMethods)
                .split(',')
                .forEach((httpMethod) => {
                if (!httpMethod)
                    return;
                returnData.push({
                    httpMethod: httpMethod.trim(),
                    node: node.name,
                    path,
                    webhookDescription,
                    workflowId,
                    workflowExecuteAdditionalData: additionalData,
                    webhookId,
                    userId: additionalData.userId,
                });
            });
        }
        return returnData;
    }
    evaluateDescriptionProperty(workflow, node, webhookDescription, property, defaultValue) {
        const native = (0, n8n_workflow_1.resolveWebhookDescriptionField)(node, webhookDescription, property);
        if (native.resolved)
            return native.value;
        return workflow.expression.getSimpleParameterValue(node, webhookDescription[property], 'internal', {}, undefined, defaultValue);
    }
    async _findWebhookConflicts(workflow, checkEntries) {
        const conflicts = [];
        const processedWebhooks = new Map();
        const webhookToKey = (webhook) => `${webhook.httpMethod} ${this.getWebhookPath(webhook)}`;
        for (const { node, webhooks } of checkEntries) {
            for (const webhook of webhooks) {
                const webhookKey = webhookToKey(webhook);
                const conflict = processedWebhooks.get(webhookKey);
                if (conflict) {
                    conflicts.push({
                        trigger: node,
                        conflict: {
                            workflowId: workflow.id,
                            webhookPath: conflict.path,
                            method: conflict.httpMethod,
                            node: conflict.node,
                            webhookId: conflict.webhookId,
                        },
                    });
                    continue;
                }
                const potentialConflict = await this.findWebhook(webhook.httpMethod, this.getWebhookPath(webhook));
                if (potentialConflict && potentialConflict.workflowId !== workflow.id) {
                    conflicts.push({
                        trigger: node,
                        conflict: potentialConflict,
                    });
                    continue;
                }
                processedWebhooks.set(webhookKey, webhook);
            }
        }
        return conflicts;
    }
    async findWebhookConflicts(workflow, additionalData) {
        const checkEntries = Object.values(workflow.nodes)
            .map((node) => ({
            node,
            webhooks: this.getNodeWebhooks(workflow, node, additionalData, true),
        }))
            .filter(({ webhooks }) => webhooks.length !== 0);
        return await this._findWebhookConflicts(workflow, checkEntries);
    }
    async createWebhookIfNotExists(workflow, webhookData, mode, activation) {
        const webhookExists = await this.runWebhookMethod('checkExists', workflow, webhookData, mode, activation);
        if (!webhookExists) {
            await this.runWebhookMethod('create', workflow, webhookData, mode, activation);
        }
    }
    async deleteWebhook(workflow, webhookData, mode, activation) {
        await this.runWebhookMethod('delete', workflow, webhookData, mode, activation);
    }
    async runWebhookMethod(method, workflow, webhookData, mode, activation) {
        const node = workflow.getNode(webhookData.node);
        if (!node)
            return;
        const nodeType = this.nodeTypes.getByNameAndVersion(node.type, node.typeVersion);
        const webhookFn = nodeType.webhookMethods?.[webhookData.webhookDescription.name]?.[method];
        if (webhookFn === undefined)
            return;
        const context = new n8n_core_1.HookContext(workflow, node, webhookData.workflowExecuteAdditionalData, mode, activation, webhookData);
        return await webhookFn.call(context);
    }
    async runWebhook(workflow, webhookData, node, additionalData, mode, runExecutionData) {
        const nodeType = this.nodeTypes.getByNameAndVersion(node.type, node.typeVersion);
        if (nodeType.webhook === undefined) {
            throw new n8n_workflow_1.UnexpectedError('Node does not have any webhooks defined', {
                extra: { nodeName: node.name },
            });
        }
        const closeFunctions = [];
        const context = new n8n_core_1.WebhookContext(workflow, node, additionalData, mode, webhookData, closeFunctions, runExecutionData ?? null);
        try {
            return (0, n8n_workflow_1.isNodeClassInstance)(nodeType)
                ? await nodeType.webhook(context)
                : await nodeType.webhook.call(context);
        }
        finally {
            const settledResults = await Promise.allSettled(closeFunctions.map(async (fn) => await fn()));
            for (const result of settledResults) {
                if (result.status === 'rejected') {
                    this.logger.error('Failed to run webhook close function', {
                        error: (0, ensure_error_1.ensureError)(result.reason),
                        nodeName: node.name,
                        nodeType: node.type,
                    });
                }
            }
        }
    }
};
exports.WebhookService = WebhookService;
exports.WebhookService = WebhookService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, db_1.WebhookRepository, backend_services_1.CacheService, node_types_1.NodeTypes])
], WebhookService);
//# sourceMappingURL=webhook.service.js.map