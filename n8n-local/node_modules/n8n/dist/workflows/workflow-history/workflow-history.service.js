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
exports.WorkflowHistoryService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const n8n_workflow_1 = require("n8n-workflow");
const shared_workflow_not_found_error_1 = require("../../errors/shared-workflow-not-found.error");
const workflow_history_version_not_found_error_1 = require("../../errors/workflow-history-version-not-found.error");
const workflow_finder_service_1 = require("../workflow-finder.service");
let WorkflowHistoryService = class WorkflowHistoryService {
    constructor(logger, workflowHistoryRepository, workflowPublishHistoryRepository, workflowRepository, workflowFinderService, eventService) {
        this.logger = logger;
        this.workflowHistoryRepository = workflowHistoryRepository;
        this.workflowPublishHistoryRepository = workflowPublishHistoryRepository;
        this.workflowRepository = workflowRepository;
        this.workflowFinderService = workflowFinderService;
        this.eventService = eventService;
    }
    async getList(user, workflowId, take, skip) {
        const workflow = await this.workflowFinderService.findWorkflowForUser(workflowId, user, [
            'workflow:read',
        ]);
        if (!workflow) {
            throw new shared_workflow_not_found_error_1.SharedWorkflowNotFoundError('');
        }
        const versions = await this.workflowHistoryRepository.find({
            where: {
                workflowId: workflow.id,
            },
            take,
            skip,
            select: [
                'workflowId',
                'versionId',
                'authors',
                'createdAt',
                'updatedAt',
                'name',
                'description',
                'autosaved',
            ],
            order: { createdAt: 'DESC', versionId: 'ASC' },
        });
        const activations = await this.workflowPublishHistoryRepository.findLatestActivations(workflow.id, versions.map(({ versionId }) => versionId));
        const activationsByVersion = new Map(activations.map((activation) => [activation.versionId, activation]));
        for (const version of versions) {
            const activation = activationsByVersion.get(version.versionId);
            version.workflowPublishHistory = activation ? [activation] : [];
        }
        return versions;
    }
    async getVersion(user, workflowId, versionId, settings) {
        const workflow = await this.workflowFinderService.findWorkflowForUser(workflowId, user, [
            'workflow:read',
        ]);
        if (!workflow) {
            throw new shared_workflow_not_found_error_1.SharedWorkflowNotFoundError('');
        }
        const hist = await this.workflowHistoryRepository.findOne({
            where: {
                workflowId: workflow.id,
                versionId,
            },
        });
        if (!hist) {
            throw new workflow_history_version_not_found_error_1.WorkflowHistoryVersionNotFoundError('');
        }
        const publishHistory = settings?.publishHistory ?? 'all';
        if (publishHistory !== 'none') {
            hist.workflowPublishHistory = await this.workflowPublishHistoryRepository.findByVersion(workflow.id, versionId, publishHistory);
        }
        return hist;
    }
    async findVersion(workflowId, versionId) {
        return await this.workflowHistoryRepository.findOne({
            where: {
                workflowId,
                versionId,
            },
        });
    }
    async snapshotCurrent(workflowId) {
        const workflow = await this.workflowRepository.findOneBy({ id: workflowId });
        if (!workflow) {
            throw new n8n_workflow_1.UnexpectedError(`Workflow ${workflowId} not found`);
        }
        const existing = await this.workflowHistoryRepository.findOne({
            where: { workflowId, versionId: workflow.versionId },
            select: ['versionId'],
        });
        if (existing)
            return { versionId: existing.versionId };
        await this.saveVersion('eval-snapshot', {
            versionId: workflow.versionId,
            nodes: workflow.nodes,
            connections: workflow.connections,
            nodeGroups: workflow.nodeGroups,
        }, workflowId);
        const persisted = await this.workflowHistoryRepository.findOne({
            where: { workflowId, versionId: workflow.versionId },
            select: ['versionId'],
        });
        if (!persisted) {
            throw new n8n_workflow_1.UnexpectedError(`Failed to persist workflow history snapshot for workflow ${workflowId}`);
        }
        return { versionId: persisted.versionId };
    }
    async saveVersion(user, workflow, workflowId, autosaved = false, source, transactionManager, versionMetadata, { ctx, propagateErrors = false } = {}) {
        const version = this.createVersionRecord({
            user,
            workflow,
            workflowId,
            autosaved,
            source,
            versionMetadata,
        });
        try {
            if (ctx) {
                await this.workflowHistoryRepository.insertVersion(version, ctx);
            }
            else {
                const repository = transactionManager
                    ? transactionManager.getRepository(db_1.WorkflowHistory)
                    : this.workflowHistoryRepository;
                await repository.insert(version);
            }
        }
        catch (e) {
            if (propagateErrors)
                throw e;
            const error = (0, ensure_error_1.ensureError)(e);
            this.logger.error(`Failed to save workflow history version for workflow ${workflowId}`, {
                error,
            });
        }
    }
    createVersionRecord({ user, workflow, workflowId, autosaved = false, source, versionMetadata, }) {
        if (!workflow.nodes || !workflow.connections) {
            throw new n8n_workflow_1.UnexpectedError(`Cannot save workflow history: nodes and connections are required for workflow ${workflowId}`);
        }
        const name = typeof user === 'string' ? user : `${user.firstName} ${user.lastName}`;
        const authors = source === 'n8n-mcp'
            ? `${name} (via MCP)`
            : source === 'n8n-ai'
                ? `${name} (with n8n Assistant)`
                : name;
        return {
            authors,
            connections: workflow.connections,
            nodes: workflow.nodes,
            nodeGroups: workflow.nodeGroups,
            versionId: workflow.versionId,
            workflowId,
            autosaved,
            ...(versionMetadata?.name ? { name: versionMetadata.name } : {}),
            ...(versionMetadata?.description ? { description: versionMetadata.description } : {}),
        };
    }
    async updateVersionForUser(user, workflowId, versionId, updateData) {
        const workflow = await this.workflowFinderService.findWorkflowForUser(workflowId, user, [
            'workflow:update',
        ]);
        if (!workflow) {
            throw new shared_workflow_not_found_error_1.SharedWorkflowNotFoundError('');
        }
        const version = await this.workflowHistoryRepository.findOne({
            where: {
                workflowId: workflow.id,
                versionId,
            },
        });
        if (!version) {
            throw new workflow_history_version_not_found_error_1.WorkflowHistoryVersionNotFoundError('');
        }
        await this.updateVersion(workflowId, versionId, updateData);
        if (updateData.name !== undefined || updateData.description !== undefined) {
            this.eventService.emit('workflow-version-updated', {
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                },
                workflowId: workflow.id,
                workflowName: workflow.name,
                versionId,
                versionName: updateData.name,
                versionDescription: updateData.description,
            });
        }
    }
    async updateVersion(workflowId, versionId, updateData) {
        await this.workflowHistoryRepository.update({ versionId, workflowId }, updateData);
    }
    async getVersionsByIds(user, workflowId, versionIds) {
        if (versionIds.length === 0) {
            return [];
        }
        const workflow = await this.workflowFinderService.findWorkflowForUser(workflowId, user, [
            'workflow:read',
        ]);
        if (!workflow) {
            throw new shared_workflow_not_found_error_1.SharedWorkflowNotFoundError('');
        }
        const versions = await this.workflowHistoryRepository.find({
            where: {
                workflowId: workflow.id,
                versionId: (0, typeorm_1.In)(versionIds),
            },
            select: ['versionId', 'createdAt'],
        });
        return versions.map((v) => ({ versionId: v.versionId, createdAt: v.createdAt }));
    }
    async getPublishTimeline(user, workflowId, page) {
        const workflow = await this.workflowFinderService.findWorkflowForUser(workflowId, user, [
            'workflow:read',
        ]);
        if (!workflow) {
            throw new shared_workflow_not_found_error_1.SharedWorkflowNotFoundError('');
        }
        const events = await this.workflowPublishHistoryRepository.findTimelinePage(workflow.id, page);
        return events.map((e) => ({
            id: e.id,
            workflowId: e.workflowId,
            versionId: e.versionId,
            event: e.event,
            createdAt: e.createdAt,
            user: e.user,
            versionName: e.workflowHistory?.name ?? null,
        }));
    }
};
exports.WorkflowHistoryService = WorkflowHistoryService;
exports.WorkflowHistoryService = WorkflowHistoryService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, db_1.WorkflowHistoryRepository, db_1.WorkflowPublishHistoryRepository, db_1.WorkflowRepository, workflow_finder_service_1.WorkflowFinderService, backend_services_1.EventService])
], WorkflowHistoryService);
//# sourceMappingURL=workflow-history.service.js.map