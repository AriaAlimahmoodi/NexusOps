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
exports.WorkflowIndexService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const n8n_workflow_1 = require("n8n-workflow");
const LOOP_LIMIT = 1_000_000_000;
const WORKFLOW_INDEXED_PLACEHOLDER_KEY = '__INDEXED__';
let WorkflowIndexService = class WorkflowIndexService {
    constructor(dependencyRepository, workflowRepository, eventService, logger, errorReporter, tracing, workflowsConfig) {
        this.dependencyRepository = dependencyRepository;
        this.workflowRepository = workflowRepository;
        this.eventService = eventService;
        this.logger = logger;
        this.errorReporter = errorReporter;
        this.tracing = tracing;
        this.batchSize = workflowsConfig.indexingBatchSize;
    }
    init() {
        this.eventService.on('server-started', async () => {
            this.logger.info('Building workflow dependency index...');
            await this.buildIndex().catch((e) => this.errorReporter.error(e));
        });
        this.eventService.on('workflow-created', async ({ workflow }) => {
            await this.updateIndexForDraft(workflow);
        });
        this.eventService.on('workflow-saved', async ({ workflow }) => {
            await this.updateIndexForDraft(workflow);
        });
        this.eventService.on('workflow-deleted', async ({ workflowId }) => {
            await this.removeDependenciesForWorkflow(workflowId);
        });
        this.eventService.on('workflow-activated', async ({ workflow }) => {
            if (workflow.activeVersionId === null) {
                this.logger.warn(`Workflow ${workflow.id} activated with null activeVersionId. Skipping index update.`);
                return;
            }
            await this.updateIndexForPublished(workflow, workflow.activeVersionId, workflow.nodes);
        });
    }
    async buildIndex() {
        return await this.tracing.startSpan({ name: 'WorkflowIndex build', op: 'workflow-index.build' }, async (span) => {
            const draftCount = await this.buildIndexInternal(async (batchSize) => await this.workflowRepository.findWorkflowsNeedingIndexing(batchSize), 'draft');
            const publishedCount = await this.buildIndexInternal(async (batchSize) => await this.workflowRepository.findWorkflowsNeedingPublishedVersionIndexing(batchSize), 'published');
            this.logger.info(`Finished building workflow dependency index. Processed ${draftCount} draft workflows, ${publishedCount} published workflows.`);
            span.setStatus({ code: 1 });
        });
    }
    async buildIndexInternal(unindexedWorkflowFinder, dependencyType) {
        const batchSize = this.batchSize;
        let processedCount = 0;
        while (processedCount < LOOP_LIMIT) {
            const workflows = await unindexedWorkflowFinder(batchSize);
            if (workflows.length === 0) {
                break;
            }
            for (const workflow of workflows) {
                if (dependencyType === 'draft') {
                    await this.updateIndexForDraft(workflow);
                }
                else {
                    const publishedNodes = workflow.activeVersion?.nodes;
                    if (!publishedNodes) {
                        this.logger.warn(`Workflow ${workflow.id} has activeVersionId but no activeVersion nodes. Skipping published index.`);
                        continue;
                    }
                    await this.updateIndexForPublished(workflow, workflow.activeVersionId, publishedNodes);
                }
            }
            processedCount += workflows.length;
            this.logger.debug(`Indexed ${processedCount} ${dependencyType} workflows so far`);
            if (workflows.length < batchSize) {
                break;
            }
        }
        if (processedCount >= LOOP_LIMIT) {
            const message = `Stopping ${dependencyType} workflow indexing because we hit the limit of ${LOOP_LIMIT} workflows. There's probably a bug causing an infinite loop.`;
            this.logger.warn(message);
            this.errorReporter.warn(new Error(message));
        }
        return processedCount;
    }
    async updateIndexForDraft(workflow) {
        const dependencyUpdates = new db_1.WorkflowDependencies(workflow.id, workflow.versionCounter, null);
        return await this.updateIndexInternal(dependencyUpdates, workflow.nodes, workflow.name, workflow.settings);
    }
    async updateIndexForPublished(workflow, publishedVersionId, publishedNodes) {
        const dependencyUpdates = new db_1.WorkflowDependencies(workflow.id, workflow.versionCounter, publishedVersionId);
        return await this.updateIndexInternal(dependencyUpdates, publishedNodes, workflow.name, workflow.settings);
    }
    async removeDependenciesForWorkflow(workflowId) {
        return await this.tracing.startSpan({
            name: 'WorkflowIndex remove',
            op: 'workflow-index.remove',
            attributes: this.tracing.pickWorkflowAttributes({ id: workflowId }),
        }, async (span) => {
            await this.dependencyRepository.removeDependenciesForWorkflow(workflowId);
            span.setStatus({ code: 1 });
        });
    }
    async updateIndexInternal(dependencyUpdates, nodes, workflowName, settings) {
        const indexType = dependencyUpdates.publishedVersionId ? 'published' : 'draft';
        const workflowId = dependencyUpdates.workflowId;
        return await this.tracing.startSpan({
            name: 'WorkflowIndex update',
            op: 'workflow-index.update',
            attributes: {
                ...this.tracing.pickWorkflowAttributes({ id: workflowId, name: workflowName }),
                'n8n.workflow-index.type': indexType,
            },
        }, async (span) => {
            nodes.forEach((node) => {
                this.addNodeTypeDependencies(node, dependencyUpdates);
                this.addCredentialDependencies(node, dependencyUpdates);
                this.addDataTableDependencies(node, dependencyUpdates);
                this.addWorkflowCallDependencies(node, dependencyUpdates);
                this.addWebhookPathDependencies(node, dependencyUpdates);
            });
            this.addErrorWorkflowDependency(settings, dependencyUpdates);
            if (dependencyUpdates.dependencies.length === 0) {
                dependencyUpdates.add({
                    dependencyType: 'workflowIndexed',
                    dependencyKey: WORKFLOW_INDEXED_PLACEHOLDER_KEY,
                    dependencyInfo: null,
                });
            }
            let updated;
            try {
                updated = await this.dependencyRepository.updateDependenciesForWorkflow(workflowId, dependencyUpdates);
            }
            catch (e) {
                const error = (0, ensure_error_1.ensureError)(e);
                this.logger.error(`Failed to update workflow ${indexType} dependency index for workflow ${workflowId}: ${error.message}`);
                this.errorReporter.error(error);
                span.setStatus({ code: 2 });
                return;
            }
            this.logger.debug(`Workflow ${indexType} dependency index ${updated ? 'updated' : 'skipped'} for workflow ${workflowId}`);
            span.setStatus({ code: 1 });
        });
    }
    addNodeTypeDependencies(node, dependencyUpdates) {
        if (node.type) {
            dependencyUpdates.add({
                dependencyType: 'nodeType',
                dependencyKey: node.type,
                dependencyInfo: { nodeId: node.id, nodeVersion: node.typeVersion },
            });
        }
    }
    addCredentialDependencies(node, dependencyUpdates) {
        if (!node.credentials) {
            return;
        }
        for (const credentialDetails of Object.values(node.credentials)) {
            const { id } = credentialDetails;
            if (!id) {
                continue;
            }
            dependencyUpdates.add({
                dependencyType: 'credentialId',
                dependencyKey: id,
                dependencyInfo: { nodeId: node.id, nodeVersion: node.typeVersion },
            });
        }
    }
    addDataTableDependencies(node, dependencyUpdates) {
        if (!n8n_workflow_1.DATA_TABLE_NODE_TYPES.includes(node.type)) {
            return;
        }
        const dataTableId = node.parameters?.['dataTableId'];
        if (!dataTableId?.value || typeof dataTableId.value !== 'string') {
            return;
        }
        if (dataTableId.value.includes('{')) {
            return;
        }
        dependencyUpdates.add({
            dependencyType: 'dataTableId',
            dependencyKey: dataTableId.value,
            dependencyInfo: { nodeId: node.id, nodeVersion: node.typeVersion, mode: dataTableId.mode },
        });
    }
    addWorkflowCallDependencies(node, dependencyUpdates) {
        if (!(0, n8n_workflow_1.isNodeWithWorkflowSelector)(node)) {
            return;
        }
        const calledWorkflowId = this.getCalledWorkflowIdFrom(node);
        if (!calledWorkflowId) {
            return;
        }
        if (calledWorkflowId.trim().startsWith('=')) {
            return;
        }
        dependencyUpdates.add({
            dependencyType: 'workflowCall',
            dependencyKey: calledWorkflowId,
            dependencyInfo: { nodeId: node.id, nodeVersion: node.typeVersion },
        });
    }
    addWebhookPathDependencies(node, dependencyUpdates) {
        if (node.type !== 'n8n-nodes-base.webhook') {
            return;
        }
        const webhookPath = node.parameters?.path;
        if (webhookPath) {
            dependencyUpdates.add({
                dependencyType: 'webhookPath',
                dependencyKey: webhookPath,
                dependencyInfo: { nodeId: node.id, nodeVersion: node.typeVersion },
            });
        }
    }
    addErrorWorkflowDependency(settings, dependencyUpdates) {
        const errorWorkflowId = settings?.errorWorkflow;
        if (!errorWorkflowId || errorWorkflowId === 'DEFAULT') {
            return;
        }
        dependencyUpdates.add({
            dependencyType: 'errorWorkflow',
            dependencyKey: errorWorkflowId,
            dependencyInfo: null,
        });
    }
    getCalledWorkflowIdFrom(node) {
        if (node.parameters?.['source'] === 'parameter') {
            return undefined;
        }
        if (node.parameters?.['source'] === 'localFile') {
            return undefined;
        }
        if (node.parameters?.['source'] === 'url') {
            return undefined;
        }
        if (!('workflowId' in node.parameters)) {
            return undefined;
        }
        if (typeof node.parameters?.['workflowId'] === 'string') {
            return node.parameters?.['workflowId'];
        }
        if (node.parameters &&
            typeof node.parameters['workflowId'] === 'object' &&
            node.parameters['workflowId'] !== null &&
            'value' in node.parameters['workflowId'] &&
            typeof node.parameters['workflowId']['value'] === 'string') {
            return node.parameters['workflowId']['value'];
        }
        this.errorReporter.warn(`While indexing, could not determine called workflow ID from ${node.type} node ${node.id}`, { extra: node.parameters });
        return undefined;
    }
};
exports.WorkflowIndexService = WorkflowIndexService;
exports.WorkflowIndexService = WorkflowIndexService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [db_1.WorkflowDependencyRepository, db_1.WorkflowRepository, backend_services_1.EventService, backend_common_1.Logger, n8n_core_1.ErrorReporter, n8n_core_1.Tracing, config_1.WorkflowsConfig])
], WorkflowIndexService);
//# sourceMappingURL=workflow-index.service.js.map