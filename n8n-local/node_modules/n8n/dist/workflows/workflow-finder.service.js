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
exports.WorkflowFinderService = void 0;
const backend_services_1 = require("@n8n/backend-services");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const permissions_1 = require("@n8n/permissions");
const typeorm_1 = require("@n8n/typeorm");
const check_access_1 = require("../permissions.ee/check-access");
let WorkflowFinderService = class WorkflowFinderService {
    constructor(sharedWorkflowRepository, folderRepository, roleService, workflowRepository, roleRepository) {
        this.sharedWorkflowRepository = sharedWorkflowRepository;
        this.folderRepository = folderRepository;
        this.roleService = roleService;
        this.workflowRepository = workflowRepository;
        this.roleRepository = roleRepository;
    }
    async findWorkflowForUser(workflowId, user, scopes, options = {}) {
        const where = await this.buildSingleWorkflowReadWhere(user, scopes, options.em ?? options.ctx);
        const sharedWorkflow = await this.sharedWorkflowRepository.findWorkflowWithOptions(workflowId, {
            where,
            includeTags: options.includeTags,
            includeParentFolder: options.includeParentFolder,
            includeActiveVersion: options.includeActiveVersion,
            publishHistory: options.publishHistory,
            ...(options.em ? { em: options.em } : { ctx: options.ctx }),
        });
        if (!sharedWorkflow) {
            return null;
        }
        return sharedWorkflow.workflow;
    }
    async findWorkflowHeadForUser(workflowId, user, scopes) {
        const where = await this.buildSingleWorkflowReadWhere(user, scopes);
        const sw = await this.sharedWorkflowRepository.findOne({
            where: { workflowId, ...where },
            relations: { workflow: true },
            select: {
                workflowId: true,
                projectId: true,
                workflow: { id: true, versionId: true, activeVersionId: true, updatedAt: true },
            },
        });
        if (!sw?.workflow)
            return null;
        return {
            versionId: sw.workflow.versionId,
            activeVersionId: sw.workflow.activeVersionId,
            updatedAt: sw.workflow.updatedAt,
        };
    }
    async buildSingleWorkflowReadWhere(user, scopes, context) {
        if ((0, permissions_1.hasGlobalScope)(user, scopes, { mode: 'allOf' }))
            return {};
        const loadRoles = context ? async () => await this.roleRepository.findAll(context) : undefined;
        const rolesWithScope = async (namespace) => loadRoles
            ? await this.roleService.rolesWithScope(namespace, scopes, loadRoles)
            : await this.roleService.rolesWithScope(namespace, scopes);
        const [projectRoles, workflowRoles] = await Promise.all([
            rolesWithScope('project'),
            rolesWithScope('workflow'),
        ]);
        return {
            role: (0, typeorm_1.In)(workflowRoles),
            project: {
                projectRelations: {
                    role: (0, typeorm_1.In)(projectRoles),
                    userId: user.id,
                },
            },
        };
    }
    async findAllWhere(user, scopes, folderId, projectId) {
        let where = {};
        if (folderId) {
            const subFolderIds = await this.folderRepository.getAllFolderIdsInHierarchy(folderId, projectId);
            where = {
                ...where,
                workflow: {
                    parentFolder: (0, typeorm_1.In)([folderId, ...subFolderIds]),
                },
            };
        }
        if (!(0, permissions_1.hasGlobalScope)(user, scopes, { mode: 'allOf' })) {
            const [projectRoles, workflowRoles] = await Promise.all([
                this.roleService.rolesWithScope('project', scopes),
                this.roleService.rolesWithScope('workflow', scopes),
            ]);
            where = {
                ...where,
                role: (0, typeorm_1.In)(workflowRoles),
                project: {
                    ...(projectId && { id: projectId }),
                    projectRelations: {
                        role: (0, typeorm_1.In)(projectRoles),
                        userId: user.id,
                    },
                },
            };
        }
        else if (projectId) {
            where = {
                ...where,
                project: {
                    id: projectId,
                },
            };
        }
        return where;
    }
    async findWorkflowIdsWithScopeForUser(workflowIds, user, scopes) {
        if (workflowIds.length === 0)
            return new Set();
        const where = await this.findAllWhere(user, scopes);
        const found = new Set();
        for (const chunk of (0, db_1.chunkIds)(workflowIds)) {
            const sharedWorkflows = await this.sharedWorkflowRepository.find({
                select: { workflowId: true },
                where: { ...where, workflowId: (0, typeorm_1.In)(chunk) },
            });
            for (const sw of sharedWorkflows)
                found.add(sw.workflowId);
        }
        return found;
    }
    async findExistingWorkflowIds(workflowIds) {
        if (workflowIds.length === 0)
            return new Set();
        const workflows = await this.workflowRepository.findByIds(workflowIds, { fields: ['id'] });
        return new Set(workflows.map(({ id }) => id));
    }
    async findWorkflowsByIdsForUser(workflowIds, user, scopes, options = {}) {
        if (workflowIds.length === 0)
            return [];
        const where = await this.findAllWhere(user, scopes);
        const seen = new Set();
        const workflows = [];
        for (const chunk of (0, db_1.chunkIds)(workflowIds)) {
            const sharedWorkflows = await this.sharedWorkflowRepository.find({
                where: { ...where, workflowId: (0, typeorm_1.In)(chunk) },
                relations: {
                    workflow: {
                        parentFolder: options.includeParentFolder,
                        tags: options.includeTags,
                        activeVersion: options.includeActiveVersion,
                    },
                },
            });
            for (const { workflow } of sharedWorkflows) {
                if (seen.has(workflow.id))
                    continue;
                seen.add(workflow.id);
                workflows.push(workflow);
            }
        }
        return workflows;
    }
    async findWorkflowIdsByFolder(folderIds, options = {}) {
        if (folderIds.length === 0)
            return new Map();
        const byFolder = new Map();
        const seen = new Set();
        for (const chunk of (0, db_1.chunkIds)(folderIds)) {
            const rows = await this.sharedWorkflowRepository.find({
                where: {
                    workflow: {
                        parentFolder: (0, typeorm_1.In)(chunk),
                        ...(options.includeArchived ? {} : { isArchived: false }),
                    },
                },
                relations: { workflow: { parentFolder: true } },
                select: { workflowId: true, workflow: { id: true, parentFolder: { id: true } } },
            });
            for (const { workflow } of rows) {
                const folderId = workflow.parentFolder?.id;
                if (!folderId || seen.has(workflow.id))
                    continue;
                seen.add(workflow.id);
                const list = byFolder.get(folderId) ?? [];
                list.push(workflow.id);
                byFolder.set(folderId, list);
            }
        }
        return byFolder;
    }
    async findOwnedWorkflowRemovalCandidates(projectId, workflowIds, options = {}) {
        return await this.sharedWorkflowRepository.findOwnedWorkflowRemovalCandidates(projectId, workflowIds, options);
    }
    async findOwnedWorkflowPlacementsInProject(projectId, options = {}) {
        const rows = await this.sharedWorkflowRepository.find({
            where: {
                project: { id: projectId },
                role: 'workflow:owner',
                ...(options.includeArchived ? {} : { workflow: { isArchived: false } }),
            },
            relations: { workflow: { parentFolder: true } },
            select: {
                workflowId: true,
                workflow: { id: true, name: true, isArchived: true, parentFolder: { id: true } },
            },
        });
        return rows.map(({ workflow }) => ({
            id: workflow.id,
            name: workflow.name,
            parentFolderId: workflow.parentFolder?.id ?? null,
            isArchived: workflow.isArchived,
        }));
    }
    async findRootWorkflowIdsInProject(projectId, options = {}) {
        const rows = await this.sharedWorkflowRepository.find({
            where: {
                project: { id: projectId },
                role: 'workflow:owner',
                workflow: {
                    parentFolder: (0, typeorm_1.IsNull)(),
                    ...(options.includeArchived ? {} : { isArchived: false }),
                },
            },
            relations: { workflow: { parentFolder: true } },
            select: { workflowId: true, workflow: { id: true, parentFolder: { id: true } } },
        });
        return rows.map((row) => row.workflowId);
    }
    async findOwnedWorkflowsBySourceWorkflowIds(projectId, sourceWorkflowIds, options = {}) {
        if (sourceWorkflowIds.length === 0)
            return [];
        const workflowRelations = {
            activeVersion: options.includeActiveVersion,
            parentFolder: options.includeParentFolder,
        };
        const archivedFilter = options.includeArchived ? {} : { isArchived: false };
        const workflows = new Map();
        for (const chunk of (0, db_1.chunkIds)(sourceWorkflowIds)) {
            const sharedWorkflows = await this.sharedWorkflowRepository.find({
                where: [
                    {
                        projectId,
                        role: 'workflow:owner',
                        workflow: { sourceWorkflowId: (0, typeorm_1.In)(chunk), ...archivedFilter },
                    },
                    {
                        projectId,
                        role: 'workflow:owner',
                        workflow: {
                            id: (0, typeorm_1.In)(chunk),
                            sourceWorkflowId: (0, typeorm_1.IsNull)(),
                            ...archivedFilter,
                        },
                    },
                ],
                relations: { workflow: workflowRelations },
            });
            for (const { workflow } of sharedWorkflows)
                workflows.set(workflow.id, workflow);
        }
        return [...workflows.values()];
    }
    async hasProjectScopeForUser(user, scopes, projectId) {
        return await (0, check_access_1.userHasScopes)(user, scopes, false, { projectId });
    }
    async findProjectIdForFolder(folderId) {
        const folder = await this.folderRepository.findOne({
            where: { id: folderId },
            relations: { homeProject: true },
        });
        return folder?.homeProject.id ?? null;
    }
    async findAllWorkflowIdsForUser(user, scopes, folderId, projectId) {
        const where = await this.findAllWhere(user, scopes, folderId, projectId);
        const sharedWorkflows = await this.sharedWorkflowRepository.find({
            select: { workflowId: true, projectId: true },
            where,
        });
        return Array.from(new Set(sharedWorkflows.map(({ workflowId }) => workflowId)));
    }
    async findWorkflowsForUser(user, scopes, options = {}) {
        const { filters = {}, offset = 0, limit, includePinnedData = false, includeTags = false, includeProjects = false, includeActiveVersion = false, includeParentFolder = false, } = options;
        const { name, active, tagNames, folderId, projectId } = filters;
        const [projectRoles, workflowRoles] = await Promise.all([
            this.roleService.rolesWithScope('project', scopes),
            this.roleService.rolesWithScope('workflow', scopes),
        ]);
        const parentFolderIds = folderId
            ? [folderId, ...(await this.folderRepository.getAllFolderIdsInHierarchy(folderId, projectId))]
            : undefined;
        const select = {
            id: true,
            name: true,
            active: true,
            activeVersionId: true,
            createdAt: true,
            updatedAt: true,
            isArchived: true,
            nodes: true,
            connections: true,
            nodeGroups: true,
            settings: true,
            staticData: true,
            meta: true,
            versionId: true,
            triggerCount: true,
            ...(includeProjects ? { ownedBy: true } : { shared: true }),
            ...(includeActiveVersion && { activeVersion: true }),
            ...(includePinnedData && { pinData: true }),
            ...(includeTags && { tags: true }),
            ...(includeParentFolder && { parentFolder: true }),
        };
        const { workflows, count } = await this.workflowRepository.getManyAndCountWithSharingSubquery(user, { scopes, projectRoles, workflowRoles }, {
            filter: {
                ...(name !== undefined && { name }),
                ...(active !== undefined && { active }),
                ...(tagNames?.length && { tags: tagNames }),
                ...(projectId && { projectId }),
                ...(parentFolderIds && { parentFolderIds }),
            },
            select,
            sortBy: 'id:asc',
            ...(limit !== undefined && { skip: offset, take: limit }),
        });
        return { workflows: workflows, count };
    }
};
exports.WorkflowFinderService = WorkflowFinderService;
exports.WorkflowFinderService = WorkflowFinderService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [db_1.SharedWorkflowRepository, db_1.FolderRepository, backend_services_1.RoleService, db_1.WorkflowRepository, db_1.RoleRepository])
], WorkflowFinderService);
//# sourceMappingURL=workflow-finder.service.js.map