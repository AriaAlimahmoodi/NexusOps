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
exports.WorkflowDependencyQueryService = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const permissions_1 = require("@n8n/permissions");
const typeorm_1 = require("@n8n/typeorm");
const backend_services_1 = require("@n8n/backend-services");
const credential_sharing_1 = require("../../constants/credential-sharing");
const data_table_repository_1 = require("../../modules/data-table/data-table.repository");
const workflow_finder_service_1 = require("../../workflows/workflow-finder.service");
const agent_usage_provider_proxy_service_1 = require("./agent-usage-provider-proxy.service");
const DEFAULT_NODE_USAGE_WORKFLOW_LIMIT = 10;
const DEFAULT_NODE_USAGE_TYPE_LIMIT = 100;
let WorkflowDependencyQueryService = class WorkflowDependencyQueryService {
    constructor(dependencyRepository, credentialsRepository, workflowRepository, dataTableRepository, workflowFinderService, credentialsFinderService, projectRelationRepository, roleService, agentUsageProvider) {
        this.dependencyRepository = dependencyRepository;
        this.credentialsRepository = credentialsRepository;
        this.workflowRepository = workflowRepository;
        this.dataTableRepository = dataTableRepository;
        this.workflowFinderService = workflowFinderService;
        this.credentialsFinderService = credentialsFinderService;
        this.projectRelationRepository = projectRelationRepository;
        this.roleService = roleService;
        this.agentUsageProvider = agentUsageProvider;
    }
    async getNodeTypeUsage(user, options = {}) {
        const [projectRoles, workflowRoles] = await Promise.all([
            this.roleService.rolesWithScope('project', ['workflow:read']),
            this.roleService.rolesWithScope('workflow', ['workflow:read']),
        ]);
        const scope = {
            projectRoles,
            workflowRoles,
            ...(options.projectId ? { projectId: options.projectId } : {}),
        };
        if (!options.nodeType) {
            return await this.dependencyRepository.countNodeTypeUsage(user, scope, options.limit ?? DEFAULT_NODE_USAGE_TYPE_LIMIT);
        }
        const limit = options.limit ?? DEFAULT_NODE_USAGE_WORKFLOW_LIMIT;
        const [rows, workflowsInScope] = await Promise.all([
            this.dependencyRepository.findWorkflowsUsingNodeType(user, scope, options.nodeType, limit + 1),
            this.dependencyRepository.countWorkflowsInScope(user, scope),
        ]);
        return {
            workflowsInScope,
            workflows: rows.slice(0, limit),
            ...(rows.length > limit ? { truncated: true } : {}),
        };
    }
    async getDependencyCounts(resourceIds, resourceType, user) {
        const loaded = await this.loadDepsForResources(resourceIds, resourceType, user);
        if (!loaded)
            return {};
        const { accessibleInputIds, maps } = loaded;
        const result = {};
        for (const id of accessibleInputIds) {
            result[id] = {
                agentUsage: maps.agentUsageMap.get(id)?.size ?? 0,
                credentialId: maps.credMap.get(id)?.size ?? 0,
                dataTableId: maps.dtMap.get(id)?.size ?? 0,
                errorWorkflow: maps.errorWfMap.get(id)?.size ?? 0,
                errorWorkflowParent: maps.errorWfParentMap.get(id)?.size ?? 0,
                workflowCall: maps.subMap.get(id)?.size ?? 0,
                workflowParent: maps.parentMap.get(id)?.size ?? 0,
            };
        }
        return result;
    }
    async getResourceDependencies(resourceIds, resourceType, user, options = {}) {
        const loaded = await this.loadDepsForResources(resourceIds, resourceType, user);
        if (!loaded)
            return {};
        const { accessibleInputIds, maps } = loaded;
        const [accessibleWfIds, accessibleCredIds, accessibleDtIds, accessibleAgentProjectIds] = await Promise.all([
            this.filterByAccess([...maps.allWfIds], 'workflow', user),
            this.filterByAccess([...maps.allCredIds], 'credential', user),
            this.filterByAccess([...maps.allDtIds], 'dataTable', user),
            maps.allAgentIds.size > 0 ? this.getAccessibleAgentProjectIds(user) : new Set(),
        ]);
        const needsWorkflowProject = resourceType === 'credential' && (0, credential_sharing_1.isCredSharingEnabled)();
        const workflowFindOptions = needsWorkflowProject
            ? {
                where: { id: (0, typeorm_1.In)([...maps.allWfIds]) },
                select: { id: true, name: true, shared: { role: true, project: { id: true } } },
                relations: { shared: { project: true } },
            }
            : {
                where: { id: (0, typeorm_1.In)([...maps.allWfIds]) },
                select: ['id', 'name'],
            };
        const [credentials, workflows, dataTables, agents] = await Promise.all([
            maps.allCredIds.size > 0
                ? this.credentialsRepository.find({
                    where: { id: (0, typeorm_1.In)([...maps.allCredIds]), usageScope: 'project' },
                    select: ['id', 'name'],
                })
                : [],
            maps.allWfIds.size > 0 ? this.workflowRepository.find(workflowFindOptions) : [],
            maps.allDtIds.size > 0
                ? this.dataTableRepository.find({
                    where: { id: (0, typeorm_1.In)([...maps.allDtIds]) },
                    select: ['id', 'name', 'projectId'],
                })
                : [],
            maps.allAgentIds.size > 0
                ? this.agentUsageProvider.findAgentSummaries([...maps.allAgentIds])
                : [],
        ]);
        const accessibleWfIdSet = new Set(accessibleWfIds);
        const accessibleCredIdSet = new Set(accessibleCredIds);
        const accessibleDtIdSet = new Set(accessibleDtIds);
        const agentNames = new Map();
        const wfNames = new Map();
        const credNames = new Map();
        const unavailableCredNames = new Map();
        const dtNames = new Map();
        const existingAgentIds = new Set();
        const existingWfIds = new Set();
        const existingCredIds = new Set();
        const existingDtIds = new Set();
        for (const agent of agents) {
            existingAgentIds.add(agent.id);
            if (accessibleAgentProjectIds === null || accessibleAgentProjectIds.has(agent.projectId)) {
                agentNames.set(agent.id, {
                    name: agent.name ?? agent.id,
                    projectId: agent.projectId,
                });
            }
        }
        const listUnavailable = options.listUnavailableCredentials === true &&
            resourceType === 'workflow' &&
            (0, credential_sharing_1.isCredSharingEnabled)();
        const unusableCredIds = new Set(listUnavailable
            ? (await this.credentialsFinderService.findUnusableCredentialsForUser(user, credentials.map((c) => c.id))).map((c) => c.id)
            : []);
        for (const c of credentials) {
            existingCredIds.add(c.id);
            if (unusableCredIds.has(c.id))
                unavailableCredNames.set(c.id, c.name ?? c.id);
            else if (accessibleCredIdSet.has(c.id))
                credNames.set(c.id, c.name ?? c.id);
        }
        for (const w of workflows) {
            existingWfIds.add(w.id);
            if (accessibleWfIdSet.has(w.id)) {
                const ownerShare = w.shared?.find((s) => s.role === 'workflow:owner');
                wfNames.set(w.id, {
                    name: w.name ?? w.id,
                    projectId: ownerShare?.project?.id,
                });
            }
        }
        for (const dt of dataTables) {
            existingDtIds.add(dt.id);
            if (accessibleDtIdSet.has(dt.id))
                dtNames.set(dt.id, { name: dt.name ?? dt.id, projectId: dt.projectId });
        }
        return this.buildEnrichedResult(accessibleInputIds, maps, {
            agentNames,
            wfNames,
            credNames,
            unavailableCredNames,
            dtNames,
        }, { existingAgentIds, existingWfIds, existingCredIds, existingDtIds });
    }
    async getFolderDependencies(projectId, folderId, user) {
        const workflowIds = await this.workflowFinderService.findAllWorkflowIdsForUser(user, ['workflow:read'], folderId, projectId);
        const dependencies = new Map();
        for (const chunk of (0, db_1.chunkIds)(workflowIds)) {
            const byWorkflow = await this.getResourceDependencies(chunk, 'workflow', user);
            for (const result of Object.values(byWorkflow)) {
                for (const dependency of result.dependencies) {
                    dependencies.set(`${dependency.type}:${dependency.id}`, dependency);
                }
            }
        }
        return [...dependencies.values()];
    }
    async loadDepsForResources(resourceIds, resourceType, user) {
        const accessibleInputIds = await this.filterByAccess(resourceIds, resourceType, user);
        if (accessibleInputIds.length === 0)
            return null;
        const [rawDeps, agentDeps] = await Promise.all([
            this.dependencyRepository.find({
                where: [
                    {
                        workflowId: (0, typeorm_1.In)(accessibleInputIds),
                        dependencyType: (0, typeorm_1.In)(['credentialId', 'dataTableId', 'errorWorkflow', 'workflowCall']),
                    },
                    { dependencyKey: (0, typeorm_1.In)(accessibleInputIds) },
                ],
                select: ['workflowId', 'dependencyType', 'dependencyKey'],
            }),
            this.loadAgentDeps(resourceType, accessibleInputIds),
        ]);
        if (rawDeps.length === 0 && agentDeps.length === 0)
            return null;
        return { accessibleInputIds, maps: this.buildDepMaps(rawDeps, agentDeps) };
    }
    async loadAgentDeps(resourceType, resourceIds) {
        return await this.agentUsageProvider.findAgentUsages(resourceType, resourceIds);
    }
    buildDepMaps(rawDeps, agentDeps) {
        const agentUsageMap = new Map();
        const credMap = new Map();
        const dtMap = new Map();
        const subMap = new Map();
        const parentMap = new Map();
        const errorWfMap = new Map();
        const errorWfParentMap = new Map();
        const allCredIds = new Set();
        const allAgentIds = new Set();
        const allWfIds = new Set();
        const allDtIds = new Set();
        for (const dep of rawDeps) {
            allWfIds.add(dep.workflowId);
            switch (dep.dependencyType) {
                case 'credentialId':
                    addToSet(credMap, dep.workflowId, dep.dependencyKey);
                    addToSet(parentMap, dep.dependencyKey, dep.workflowId);
                    allCredIds.add(dep.dependencyKey);
                    break;
                case 'dataTableId':
                    addToSet(dtMap, dep.workflowId, dep.dependencyKey);
                    addToSet(parentMap, dep.dependencyKey, dep.workflowId);
                    allDtIds.add(dep.dependencyKey);
                    break;
                case 'workflowCall':
                    addToSet(subMap, dep.workflowId, dep.dependencyKey);
                    addToSet(parentMap, dep.dependencyKey, dep.workflowId);
                    allWfIds.add(dep.dependencyKey);
                    break;
                case 'errorWorkflow':
                    addToSet(errorWfMap, dep.workflowId, dep.dependencyKey);
                    addToSet(errorWfParentMap, dep.dependencyKey, dep.workflowId);
                    allWfIds.add(dep.dependencyKey);
                    break;
            }
        }
        for (const dep of agentDeps) {
            addToSet(agentUsageMap, dep.resourceId, dep.agentId);
            allAgentIds.add(dep.agentId);
        }
        return {
            agentUsageMap,
            credMap,
            dtMap,
            subMap,
            parentMap,
            errorWfMap,
            errorWfParentMap,
            allCredIds,
            allAgentIds,
            allWfIds,
            allDtIds,
        };
    }
    buildEnrichedResult(resourceIds, maps, accessMaps, existing) {
        const result = {};
        for (const resourceId of resourceIds) {
            const dependencies = [];
            let inaccessibleCount = 0;
            for (const id of maps.agentUsageMap.get(resourceId) ?? []) {
                if (!existing.existingAgentIds.has(id))
                    continue;
                const agent = accessMaps.agentNames.get(id);
                if (agent) {
                    dependencies.push({
                        id,
                        name: agent.name,
                        type: 'agentUsage',
                        projectId: agent.projectId,
                    });
                }
                else {
                    inaccessibleCount++;
                }
            }
            const resolve = (ids, nameMap, existingIds, type) => {
                for (const id of ids ?? []) {
                    if (!existingIds.has(id))
                        continue;
                    const name = nameMap.get(id);
                    const unavailableName = accessMaps.unavailableCredNames.get(id);
                    if (name !== undefined) {
                        dependencies.push({ id, name, type });
                    }
                    else if (type === 'credentialId' && unavailableName !== undefined) {
                        dependencies.push({ id, name: unavailableName, type, unavailable: true });
                    }
                    else {
                        inaccessibleCount++;
                    }
                }
            };
            const resolveWorkflowDep = (ids, type) => {
                for (const id of ids ?? []) {
                    if (!existing.existingWfIds.has(id))
                        continue;
                    const workflow = accessMaps.wfNames.get(id);
                    if (workflow) {
                        dependencies.push({
                            id,
                            name: workflow.name,
                            type,
                            projectId: workflow.projectId,
                        });
                    }
                    else {
                        inaccessibleCount++;
                    }
                }
            };
            resolveWorkflowDep(maps.subMap.get(resourceId), 'workflowCall');
            resolveWorkflowDep(maps.parentMap.get(resourceId), 'workflowParent');
            resolveWorkflowDep(maps.errorWfMap.get(resourceId), 'errorWorkflow');
            resolveWorkflowDep(maps.errorWfParentMap.get(resourceId), 'errorWorkflowParent');
            resolve(maps.credMap.get(resourceId), accessMaps.credNames, existing.existingCredIds, 'credentialId');
            for (const id of maps.dtMap.get(resourceId) ?? []) {
                if (!existing.existingDtIds.has(id))
                    continue;
                const dt = accessMaps.dtNames.get(id);
                if (dt) {
                    dependencies.push({ id, name: dt.name, type: 'dataTableId', projectId: dt.projectId });
                }
                else {
                    inaccessibleCount++;
                }
            }
            result[resourceId] = { dependencies, inaccessibleCount };
        }
        return result;
    }
    async filterByAccess(ids, resourceType, user) {
        if (ids.length === 0)
            return [];
        switch (resourceType) {
            case 'workflow': {
                const accessible = await this.workflowFinderService.findWorkflowIdsWithScopeForUser(ids, user, ['workflow:read']);
                return ids.filter((id) => accessible.has(id));
            }
            case 'credential': {
                const accessible = await this.credentialsFinderService.findCredentialIdsWithScopeForUser(ids, user, ['credential:read'], { visibilityOnly: true });
                return ids.filter((id) => accessible.has(id));
            }
            case 'dataTable': {
                return await this.filterDataTableIdsByAccess(ids, user);
            }
        }
    }
    async filterDataTableIdsByAccess(ids, user) {
        if ((0, permissions_1.hasGlobalScope)(user, 'dataTable:listProject'))
            return ids;
        const dataTables = await this.dataTableRepository.find({
            where: { id: (0, typeorm_1.In)(ids) },
            select: ['id', 'projectId'],
        });
        const roles = await this.roleService.rolesWithScope('project', ['dataTable:listProject']);
        const accessibleProjectIds = new Set(await this.projectRelationRepository.getAccessibleProjectsByRoles(user.id, roles));
        return dataTables.filter((dt) => accessibleProjectIds.has(dt.projectId)).map((dt) => dt.id);
    }
    async getAccessibleAgentProjectIds(user) {
        if ((0, permissions_1.hasGlobalScope)(user, 'agent:read'))
            return null;
        const roles = await this.roleService.rolesWithScope('project', ['agent:read']);
        return new Set(await this.projectRelationRepository.getAccessibleProjectsByRoles(user.id, roles));
    }
};
exports.WorkflowDependencyQueryService = WorkflowDependencyQueryService;
exports.WorkflowDependencyQueryService = WorkflowDependencyQueryService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [db_1.WorkflowDependencyRepository, db_1.CredentialsRepository, db_1.WorkflowRepository, data_table_repository_1.DataTableRepository, workflow_finder_service_1.WorkflowFinderService, backend_services_1.CredentialsFinderService, db_1.ProjectRelationRepository, backend_services_1.RoleService, agent_usage_provider_proxy_service_1.AgentUsageProviderProxy])
], WorkflowDependencyQueryService);
function addToSet(map, key, val) {
    let set = map.get(key);
    if (!set) {
        set = new Set();
        map.set(key, set);
    }
    set.add(val);
}
//# sourceMappingURL=workflow-dependency-query.service.js.map