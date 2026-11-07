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
exports.EvalThreadRestoreService = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const agent_config_1 = require("@n8n/ai-utilities/agent-config");
const is_record_1 = require("@n8n/utils/is-record");
const n8n_workflow_1 = require("n8n-workflow");
const node_crypto_1 = require("node:crypto");
const errors_1 = require("@n8n/errors");
const agents_service_1 = require("../../../modules/agents/agents.service");
const data_table_service_1 = require("../../../modules/data-table/data-table.service");
const policy_enforcement_service_1 = require("../../../policy/policy-enforcement.service");
const policy_violation_error_1 = require("../../../policy/policy-violation.error");
const folder_service_1 = require("../../../services/folder.service");
const workflow_history_service_1 = require("../../../workflows/workflow-history/workflow-history.service");
const workflow_service_1 = require("../../../workflows/workflow.service");
function isWorkflowNode(value) {
    if (!(0, is_record_1.isRecord)(value))
        return false;
    return (typeof value.id === 'string' &&
        typeof value.name === 'string' &&
        typeof value.type === 'string' &&
        typeof value.typeVersion === 'number' &&
        Array.isArray(value.position) &&
        value.position.length === 2 &&
        value.position.every((coordinate) => typeof coordinate === 'number') &&
        (0, is_record_1.isRecord)(value.parameters));
}
function isConnections(value) {
    return (0, is_record_1.isRecord)(value);
}
function blankCredentialValues(value) {
    if (Array.isArray(value))
        return value.map(blankCredentialValues);
    if (!(0, is_record_1.isRecord)(value))
        return value;
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => {
        if ((key === 'credential' || key === 'credentialId') && typeof entry === 'string')
            return [key, ''];
        if (key === 'credentials' && (0, is_record_1.isRecord)(entry))
            return [key, {}];
        return [key, blankCredentialValues(entry)];
    }));
}
let EvalThreadRestoreService = class EvalThreadRestoreService {
    constructor(workflowRepo, sharedWorkflowRepo, credentialsRepo, workflowPublishedVersionRepo, dataTableService, policyEnforcementService, workflowHistoryService, workflowService, folderService, licenseState) {
        this.workflowRepo = workflowRepo;
        this.sharedWorkflowRepo = sharedWorkflowRepo;
        this.credentialsRepo = credentialsRepo;
        this.workflowPublishedVersionRepo = workflowPublishedVersionRepo;
        this.dataTableService = dataTableService;
        this.policyEnforcementService = policyEnforcementService;
        this.workflowHistoryService = workflowHistoryService;
        this.workflowService = workflowService;
        this.folderService = folderService;
        this.licenseState = licenseState;
    }
    async restoreFolders(folders, projectId, user) {
        const idMap = new Map();
        if (folders.length === 0)
            return idMap;
        if (!this.licenseState.isFoldersLicensed()) {
            throw new errors_1.BadRequestError('Seeding folders requires the `feat:folders` license feature, which this instance does not have. ' +
                'CI/real instance: needs N8N_LICENSE_ACTIVATION_KEY + N8N_LICENSE_CERT. ' +
                'Local run with E2E_TESTS=true: /rest/e2e/reset stubs the license to ALL-FALSE, so re-enable it after seeding the owner: ' +
                'PATCH /rest/e2e/feature {"feature":"feat:folders","enabled":true}');
        }
        try {
            const pending = [...folders];
            while (pending.length > 0) {
                const index = pending.findIndex((folder) => folder.parentFolderId === undefined || idMap.has(folder.parentFolderId));
                if (index === -1) {
                    throw new errors_1.BadRequestError(`Seed folders ${pending.map((folder) => `"${folder.id}"`).join(', ')} have no creatable parent`);
                }
                const [folder] = pending.splice(index, 1);
                const created = await this.folderService.createFolder({
                    name: folder.name,
                    parentFolderId: folder.parentFolderId === undefined ? undefined : idMap.get(folder.parentFolderId),
                }, projectId);
                idMap.set(folder.id, created.id);
            }
        }
        catch (error) {
            await this.deleteFolders(folders, idMap, projectId, user);
            throw error;
        }
        return idMap;
    }
    async deleteFolders(folders, idMap, projectId, user) {
        const depth = (folder) => {
            let level = 0;
            let parentId = folder.parentFolderId;
            while (parentId !== undefined && level < folders.length) {
                level += 1;
                parentId = folders.find((candidate) => candidate.id === parentId)?.parentFolderId;
            }
            return level;
        };
        const failed = new Set();
        for (const folder of [...folders].sort((a, b) => depth(b) - depth(a))) {
            const createdId = idMap.get(folder.id);
            if (createdId === undefined)
                continue;
            if (folders.some((child) => child.parentFolderId === folder.id && failed.has(child.id))) {
                failed.add(folder.id);
                continue;
            }
            try {
                await this.folderService.deleteFolder(user, createdId, projectId, {
                    transferToFolderId: n8n_workflow_1.PROJECT_ROOT,
                });
            }
            catch {
                failed.add(folder.id);
            }
        }
    }
    async restoreDataTables(dataTables, projectId, options = {}) {
        const uniquifyNames = options.uniquifyNames ?? true;
        const idMap = new Map();
        try {
            for (const table of dataTables) {
                if (table.id.length < 8) {
                    throw new errors_1.BadRequestError(`Seed data table id "${table.id}" is too short to remap safely (need ≥8 chars)`);
                }
                let name = table.name;
                if (uniquifyNames) {
                    const suffix = ` [seed ${(0, node_crypto_1.randomUUID)().slice(0, 8)}]`;
                    name = `${table.name.slice(0, 128 - suffix.length)}${suffix}`;
                }
                const created = await this.dataTableService.createDataTable(projectId, {
                    name,
                    columns: table.columns,
                });
                idMap.set(table.id, created.id);
                if (table.rows && table.rows.length > 0) {
                    await this.dataTableService.insertRows(created.id, projectId, table.rows);
                }
            }
        }
        catch (error) {
            await this.deleteDataTables([...idMap.values()], projectId);
            throw error;
        }
        return idMap;
    }
    async reseedDataTableRows(tableId, projectId, rows) {
        await this.dataTableService.clearRows(tableId, projectId);
        if (rows.length > 0) {
            await this.dataTableService.insertRows(tableId, projectId, rows);
        }
    }
    async deleteDataTables(dataTableIds, projectId) {
        for (const id of dataTableIds) {
            try {
                await this.dataTableService.deleteDataTable(id, projectId);
            }
            catch {
            }
        }
    }
    async restoreAgents(agents, projectId, user, dataTableIdMap = new Map(), allowedCredentialIds) {
        if (agents.length === 0)
            return [];
        const agentsService = this.agentsService();
        const created = [];
        try {
            for (const agent of agents) {
                const config = api_types_1.AgentJsonConfigSchema.safeParse(blankCredentialValues(this.remapDataTableIds(agent.config, dataTableIdMap)));
                if (!config.success) {
                    throw new errors_1.BadRequestError(`Seed agent ${agent.id} config became invalid after blanking its credentials`);
                }
                const schema = await this.bindModelCredentials(config.data, projectId, allowedCredentialIds);
                await agentsService.create(projectId, schema.name, {
                    actor: { kind: 'user', user },
                    id: agent.id,
                    schema,
                    ...(agent.skills ? { skills: agent.skills, skillCreator: user } : {}),
                });
                created.push(agent.id);
            }
        }
        catch (error) {
            await this.deleteAgents(created, projectId);
            throw error;
        }
        return created;
    }
    async bindModelCredentials(config, projectId, allowedCredentialIds) {
        const resolve = async (model) => {
            const types = (0, api_types_1.getAgentModelProviderCredentialTypes)((0, agent_config_1.getProviderPrefix)(model));
            if (types.length === 0)
                return undefined;
            const candidates = (await this.credentialsRepo.findByTypesInProject([...types], projectId)).filter((c) => allowedCredentialIds?.has(c.id) ?? true);
            return candidates.length === 1 ? candidates[0].id : undefined;
        };
        const bound = { ...config };
        const credential = config.model ? await resolve(config.model) : undefined;
        if (credential)
            bound.credential = credential;
        const byDifficulty = config.subAgents?.modelsByDifficulty;
        if (byDifficulty) {
            const rebound = { ...byDifficulty };
            for (const level of api_types_1.SUB_AGENT_TASK_DIFFICULTIES) {
                const entry = rebound[level];
                const id = entry && (await resolve(entry.model));
                if (entry && id)
                    rebound[level] = { ...entry, credential: id };
            }
            bound.subAgents = { ...config.subAgents, modelsByDifficulty: rebound };
        }
        return bound;
    }
    remapDataTableIds(value, dataTableIdMap) {
        if (dataTableIdMap.size === 0)
            return value;
        let serialized = JSON.stringify(value);
        const byLongest = [...dataTableIdMap].sort(([a], [b]) => b.length - a.length);
        for (const [oldId, newId] of byLongest) {
            serialized = serialized.replaceAll(oldId, newId);
        }
        return (0, n8n_workflow_1.jsonParse)(serialized);
    }
    async deleteAgents(agentIds, projectId) {
        for (const id of agentIds) {
            try {
                await this.agentsService().delete(id, projectId);
            }
            catch {
            }
        }
    }
    agentsService() {
        if (!di_1.Container.get(backend_common_1.ModuleRegistry).isActive('agents')) {
            throw new errors_1.BadRequestError('Seeding an agent requires the agents module to be enabled');
        }
        return di_1.Container.get(agents_service_1.AgentsService);
    }
    async restoreWorkflows(workflows, projectId, user, dataTableIdMap = new Map(), allowedCredentialIds, folderIdMap = new Map()) {
        const created = [];
        try {
            for (const workflow of workflows) {
                const isNew = await this.createWorkflowPinnedToId(workflow, projectId, user, dataTableIdMap, allowedCredentialIds, folderIdMap);
                if (isNew)
                    created.push(workflow.id);
            }
        }
        catch (error) {
            await this.deleteWorkflows(created);
            throw error;
        }
        return created;
    }
    async publishSeedWorkflows(workflows, user) {
        const attempted = [];
        try {
            for (const workflow of workflows) {
                if (!workflow.published)
                    continue;
                await this.workflowHistoryService.snapshotCurrent(workflow.id);
                attempted.push(workflow.id);
                await this.workflowService.activateWorkflow(user, workflow.id);
            }
        }
        catch (error) {
            await this.unpublishWorkflows(attempted);
            throw error;
        }
        return attempted;
    }
    async unpublishWorkflows(workflowIds) {
        for (const id of workflowIds) {
            try {
                await this.workflowService.deactivateWorkflowAsSystem(id);
            }
            catch {
            }
        }
    }
    async deleteWorkflows(workflowIds) {
        const deadline = Date.now() + 10_000;
        for (const id of workflowIds) {
            try {
                await this.workflowService.deactivateWorkflowAsSystem(id);
            }
            catch {
            }
            await this.awaitPublicationTeardown(id, deadline);
            try {
                await this.workflowRepo.delete({ id });
            }
            catch {
            }
        }
    }
    async awaitPublicationTeardown(workflowId, deadline) {
        try {
            while (await this.workflowPublishedVersionRepo.getPublishedVersionId(workflowId)) {
                if (Date.now() >= deadline)
                    return;
                await new Promise((resolve) => setTimeout(resolve, 200));
            }
        }
        catch {
        }
    }
    async createWorkflowPinnedToId(workflow, projectId, user, dataTableIdMap, allowedCredentialIds, folderIdMap) {
        const remapDataTableIds = (value) => this.remapDataTableIds(value, dataTableIdMap);
        const parentFolderId = workflow.parentFolderId === undefined ? null : folderIdMap.get(workflow.parentFolderId);
        if (parentFolderId === undefined) {
            throw new errors_1.BadRequestError(`Seed workflow ${workflow.id} is placed in folder "${workflow.parentFolderId}", which this restore did not create`);
        }
        const nodes = [];
        for (const [index, node] of workflow.nodes.entries()) {
            if (!isWorkflowNode(node)) {
                throw new errors_1.BadRequestError(`Seed workflow ${workflow.id} node at index ${index} is not a valid workflow node`);
            }
            const { credentials, ...rest } = node;
            const resolved = await this.resolveNodeCredentials(workflow, credentials, projectId, allowedCredentialIds);
            const remapped = remapDataTableIds(resolved ? { ...rest, credentials: resolved } : rest);
            if (!isWorkflowNode(remapped)) {
                throw new errors_1.BadRequestError(`Seed workflow ${workflow.id} node at index ${index} became invalid after data-table id remap`);
            }
            nodes.push(remapped);
        }
        const connections = remapDataTableIds(workflow.connections);
        if (!isConnections(connections)) {
            throw new errors_1.BadRequestError(`Seed workflow ${workflow.id} connections must be an object`);
        }
        const owningProject = await this.sharedWorkflowRepo.getWorkflowOwningProject(workflow.id);
        if (owningProject && owningProject.id !== projectId) {
            throw new errors_1.BadRequestError(`Seed workflow id ${workflow.id} already exists in another project; refusing to overwrite`);
        }
        const stored = owningProject ? await this.findStoredWorkflow(workflow.id) : null;
        const entity = this.workflowRepo.create({
            id: workflow.id,
            name: workflow.name,
            nodes,
            connections,
            active: false,
            versionId: (0, node_crypto_1.randomUUID)(),
            parentFolder: parentFolderId === null ? null : { id: parentFolderId },
        });
        const cleared = await this.enforceSeedWorkflowSave(workflow, entity, stored, projectId, user);
        await this.workflowRepo.runInTransaction({ policyCleared: cleared }, async (em, ctx) => {
            if (stored) {
                const { name, nodes, connections, active, versionId, parentFolder } = entity;
                await this.workflowRepo.updateContent(workflow.id, { name, nodes, connections, active, versionId, parentFolder }, ctx);
            }
            else {
                await this.workflowRepo.createContent(entity, ctx);
                await this.sharedWorkflowRepo.makeOwner([workflow.id], projectId, em);
            }
        });
        return stored === null;
    }
    async resolveNodeCredentials(seed, credentials, projectId, allowedCredentialIds) {
        if (!(0, is_record_1.isRecord)(credentials))
            return undefined;
        const resolved = {};
        for (const [type, ref] of Object.entries(credentials)) {
            const name = (0, is_record_1.isRecord)(ref) && typeof ref.name === 'string' ? ref.name : undefined;
            if (name === undefined) {
                if (seed.published) {
                    throw new errors_1.BadRequestError(`Seed workflow ${seed.id} is published, but its ${type} credential reference has no name`);
                }
                continue;
            }
            const candidates = (await this.credentialsRepo.findByNameAndTypeInProject(name, type, projectId)).filter((c) => allowedCredentialIds?.has(c.id) ?? true);
            if (candidates.length === 1) {
                resolved[type] = { id: candidates[0].id, name: candidates[0].name };
            }
            else if (seed.published) {
                throw new errors_1.BadRequestError(`Seed workflow ${seed.id} is published, but its ${type} credential "${name}" matched ${candidates.length} project credentials (need exactly 1)`);
            }
        }
        return Object.keys(resolved).length > 0 ? resolved : undefined;
    }
    async findStoredWorkflow(id) {
        const [stored] = await this.workflowRepo.findByIds([id], { fields: ['id', 'name', 'nodes'] });
        return stored ? { id: stored.id, name: stored.name, nodes: stored.nodes } : null;
    }
    async enforceSeedWorkflowSave(seed, entity, stored, projectId, user) {
        try {
            return await this.policyEnforcementService.enforceWorkflowSave({
                workflow: { id: stored?.id ?? null, name: entity.name, nodes: entity.nodes },
                storedWorkflow: stored,
                projectId,
            }, { kind: 'user', user });
        }
        catch (error) {
            if (error instanceof policy_violation_error_1.PolicyViolationError && (0, policy_violation_error_1.hasViolations)(error.violations)) {
                throw new policy_violation_error_1.PolicyViolationError(error.violations, `Seed workflow ${seed.id} ("${seed.name}") was refused by policy: ${error.message}`);
            }
            throw error;
        }
    }
};
exports.EvalThreadRestoreService = EvalThreadRestoreService;
exports.EvalThreadRestoreService = EvalThreadRestoreService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [db_1.WorkflowRepository, db_1.SharedWorkflowRepository, db_1.CredentialsRepository, db_1.WorkflowPublishedVersionRepository, data_table_service_1.DataTableService, policy_enforcement_service_1.PolicyEnforcementService, workflow_history_service_1.WorkflowHistoryService, workflow_service_1.WorkflowService, folder_service_1.FolderService, backend_common_1.LicenseState])
], EvalThreadRestoreService);
//# sourceMappingURL=thread-restore.service.js.map