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
exports.McpSettingsService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const n8n_workflow_1 = require("n8n-workflow");
const collaboration_service_1 = require("../../collaboration/collaboration.service");
const errors_1 = require("@n8n/errors");
const backend_services_1 = require("@n8n/backend-services");
const workflow_helpers_1 = require("../../workflow-helpers");
const workflow_finder_service_1 = require("../../workflows/workflow-finder.service");
const KEY = 'mcp.access.enabled';
const REDIRECT_URIS_KEY = 'mcp.oauth.allowedRedirectUris';
const AUTO_EXPOSE_NEW_WORKFLOWS_KEY = 'mcp.autoExposeNewWorkflows';
const BULK_CHUNK_SIZE = 500;
const WORKFLOW_SETTINGS_FIELDS = ['id', 'settings'];
let McpSettingsService = class McpSettingsService {
    constructor(settingsRepository, cacheService, workflowRepository, workflowFinderService, globalConfig, logger, collaborationService) {
        this.settingsRepository = settingsRepository;
        this.cacheService = cacheService;
        this.workflowRepository = workflowRepository;
        this.workflowFinderService = workflowFinderService;
        this.globalConfig = globalConfig;
        this.logger = logger;
        this.collaborationService = collaborationService;
    }
    async getEnabled(em) {
        const isMcpAccessEnabled = await this.cacheService.get(KEY);
        if (isMcpAccessEnabled !== undefined) {
            return isMcpAccessEnabled === 'true';
        }
        const row = await this.settingsRepository.findByKey(KEY, em);
        const enabled = row?.value === 'true';
        await this.cacheService.set(KEY, enabled.toString());
        return enabled;
    }
    async setEnabled(enabled) {
        await this.settingsRepository.upsert({ key: KEY, value: enabled.toString(), loadOnStartup: true }, ['key']);
        await this.cacheService.set(KEY, enabled.toString());
    }
    async getAllowedRedirectUris() {
        const cachedUris = await this.cacheService.get(REDIRECT_URIS_KEY);
        if (cachedUris !== undefined) {
            return (0, n8n_workflow_1.jsonParse)(cachedUris, { fallbackValue: [] });
        }
        const row = await this.settingsRepository.findByKey(REDIRECT_URIS_KEY);
        const uris = row?.value ? (0, n8n_workflow_1.jsonParse)(row.value, { fallbackValue: [] }) : [];
        await this.cacheService.set(REDIRECT_URIS_KEY, JSON.stringify(uris));
        return uris;
    }
    async setAllowedRedirectUris(uris) {
        await this.settingsRepository.upsert({ key: REDIRECT_URIS_KEY, value: JSON.stringify(uris), loadOnStartup: true }, ['key']);
        await this.cacheService.set(REDIRECT_URIS_KEY, JSON.stringify(uris));
    }
    async getAutoExposeNewWorkflows(em) {
        if (!(await this.getEnabled(em))) {
            return false;
        }
        const cached = await this.cacheService.get(AUTO_EXPOSE_NEW_WORKFLOWS_KEY);
        if (cached !== undefined) {
            return cached === 'true';
        }
        const row = await this.settingsRepository.findByKey(AUTO_EXPOSE_NEW_WORKFLOWS_KEY, em);
        const enabled = row?.value === 'true';
        await this.cacheService.set(AUTO_EXPOSE_NEW_WORKFLOWS_KEY, enabled.toString());
        return enabled;
    }
    async setAutoExposeNewWorkflows(enabled) {
        await this.settingsRepository.upsert({ key: AUTO_EXPOSE_NEW_WORKFLOWS_KEY, value: enabled.toString(), loadOnStartup: true }, ['key']);
        await this.cacheService.set(AUTO_EXPOSE_NEW_WORKFLOWS_KEY, enabled.toString());
    }
    async bulkSetAvailableInMCP(user, dto) {
        const { availableInMCP, workflowIds, projectId, folderId, allWorkflows } = dto;
        const scopeCount = [workflowIds, projectId, folderId, allWorkflows].filter(Boolean).length;
        if (scopeCount !== 1) {
            throw new errors_1.BadRequestError('Provide exactly one of workflowIds, projectId, folderId or allWorkflows');
        }
        const candidateIds = await this.resolveCandidateIds(user, {
            workflowIds,
            projectId,
            folderId,
            allWorkflows,
        });
        const isWorkflowIdsScope = Boolean(workflowIds);
        const baselineSize = isWorkflowIdsScope ? new Set(workflowIds).size : candidateIds.length;
        if (candidateIds.length === 0) {
            return {
                updatedCount: 0,
                unchangedCount: 0,
                skippedCount: baselineSize,
                failedCount: 0,
                changedWorkflows: [],
                ...(isWorkflowIdsScope ? { updatedIds: [], unchangedIds: [] } : {}),
            };
        }
        let openWorkflowIds;
        try {
            openWorkflowIds = new Set(await this.collaborationService.filterOpenWorkflowIds(candidateIds));
        }
        catch (error) {
            openWorkflowIds = new Set();
            this.logger.warn('Failed to resolve open workflows before bulk MCP availability update', {
                cause: error instanceof Error ? error.message : String(error),
            });
        }
        const writtenIds = [];
        const changedWorkflows = [];
        const noOpIds = [];
        let failedCount = 0;
        for (let start = 0; start < candidateIds.length; start += BULK_CHUNK_SIZE) {
            const chunk = candidateIds.slice(start, start + BULK_CHUNK_SIZE);
            try {
                const chunkResult = await this.workflowRepository.manager.transaction(async (trx) => {
                    const chunkWritten = [];
                    const chunkNoOp = [];
                    const now = new Date();
                    const settingsRows = await trx.find(db_1.WorkflowEntity, {
                        where: { id: (0, typeorm_1.In)(chunk), isArchived: false },
                        select: WORKFLOW_SETTINGS_FIELDS,
                    });
                    const nextSettingsByWorkflowId = new Map();
                    for (const row of settingsRows) {
                        if (row.settings?.availableInMCP === availableInMCP) {
                            chunkNoOp.push(row.id);
                            continue;
                        }
                        const nextSettings = (0, workflow_helpers_1.removeDefaultValues)({ ...(row.settings ?? {}), availableInMCP }, this.globalConfig.executions.timeout);
                        nextSettingsByWorkflowId.set(row.id, nextSettings);
                    }
                    if (nextSettingsByWorkflowId.size === 0) {
                        return { written: chunkWritten, noOp: chunkNoOp };
                    }
                    const openIdsInChunk = [...nextSettingsByWorkflowId.keys()].filter((id) => openWorkflowIds.has(id));
                    const checksumRows = openIdsInChunk.length > 0
                        ? await trx.find(db_1.WorkflowEntity, {
                            where: { id: (0, typeorm_1.In)(openIdsInChunk), isArchived: false },
                            select: ['id', ...n8n_workflow_1.WORKFLOW_CHECKSUM_FIELDS],
                        })
                        : [];
                    const checksumRowByWorkflowId = new Map(checksumRows.map((row) => [row.id, row]));
                    for (const [workflowId, nextSettings] of nextSettingsByWorkflowId) {
                        await trx.update(db_1.WorkflowEntity, { id: workflowId, isArchived: false }, { settings: nextSettings, updatedAt: now });
                        const checksumRow = checksumRowByWorkflowId.get(workflowId);
                        const checksum = checksumRow
                            ? await (0, n8n_workflow_1.calculateWorkflowChecksum)({ ...checksumRow, settings: nextSettings })
                            : undefined;
                        chunkWritten.push({
                            workflowId,
                            settings: { availableInMCP },
                            ...(checksum === undefined ? {} : { checksum }),
                        });
                    }
                    return { written: chunkWritten, noOp: chunkNoOp };
                });
                writtenIds.push(...chunkResult.written.map(({ workflowId }) => workflowId));
                changedWorkflows.push(...chunkResult.written);
                noOpIds.push(...chunkResult.noOp);
            }
            catch (error) {
                failedCount += chunk.length;
                this.logger.error('Failed to bulk-update workflow MCP availability for chunk', {
                    error,
                    chunkSize: chunk.length,
                    chunkStart: start,
                    availableInMCP,
                });
            }
        }
        return {
            updatedCount: writtenIds.length,
            unchangedCount: noOpIds.length,
            skippedCount: Math.max(0, baselineSize - writtenIds.length - noOpIds.length - failedCount),
            failedCount,
            changedWorkflows,
            ...(isWorkflowIdsScope ? { updatedIds: writtenIds, unchangedIds: noOpIds } : {}),
        };
    }
    async broadcastWorkflowMCPAvailabilityChanged(changes) {
        if (changes.length === 0)
            return;
        const workflowIds = changes.map(({ workflowId }) => workflowId);
        let openWorkflowIds;
        try {
            openWorkflowIds = await this.collaborationService.filterOpenWorkflowIds(workflowIds);
        }
        catch (error) {
            this.logger.warn('Failed to resolve open workflows for settings update broadcast', {
                workflowCount: changes.length,
                workflowIds: workflowIds.slice(0, 10),
                cause: error instanceof Error ? error.message : String(error),
            });
            return;
        }
        if (openWorkflowIds.length === 0)
            return;
        const changesByWorkflowId = new Map(changes.map((change) => [change.workflowId, change]));
        await Promise.all(openWorkflowIds.map(async (workflowId) => {
            try {
                const change = changesByWorkflowId.get(workflowId);
                if (!change)
                    return;
                await this.collaborationService.broadcastWorkflowSettingsUpdated(workflowId, change.settings, change.checksum);
            }
            catch (error) {
                this.logger.warn('Failed to broadcast workflow settings update', {
                    workflowId,
                    cause: error instanceof Error ? error.message : String(error),
                });
            }
        }));
    }
    async resolveCandidateIds(user, scope) {
        if (scope.allWorkflows) {
            return await this.workflowFinderService.findAllWorkflowIdsForUser(user, ['workflow:update']);
        }
        if (scope.workflowIds) {
            const uniqueIds = [...new Set(scope.workflowIds)];
            const accessibleIds = await this.workflowFinderService.findWorkflowIdsWithScopeForUser(uniqueIds, user, ['workflow:update']);
            return uniqueIds.filter((id) => accessibleIds.has(id));
        }
        const projectId = scope.projectId ??
            (scope.folderId
                ? await this.workflowFinderService.findProjectIdForFolder(scope.folderId)
                : null);
        if (projectId === null ||
            !(await this.workflowFinderService.hasProjectScopeForUser(user, ['workflow:update'], projectId))) {
            return [];
        }
        return await this.workflowFinderService.findAllWorkflowIdsForUser(user, ['workflow:update'], scope.folderId, projectId);
    }
};
exports.McpSettingsService = McpSettingsService;
exports.McpSettingsService = McpSettingsService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [db_1.SettingsRepository, backend_services_1.CacheService, db_1.WorkflowRepository, workflow_finder_service_1.WorkflowFinderService, config_1.GlobalConfig, backend_common_1.Logger, collaboration_service_1.CollaborationService])
], McpSettingsService);
//# sourceMappingURL=mcp.settings.service.js.map