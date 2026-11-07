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
exports.N8nPackageParser = void 0;
const backend_common_1 = require("@n8n/backend-common");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const zod_1 = require("zod");
const errors_1 = require("@n8n/errors");
const node_types_1 = require("../../../node-types");
const WorkflowHelpers = __importStar(require("../../../workflow-helpers"));
const package_layout_1 = require("./package-layout");
const workflow_published_state_1 = require("../entities/workflow/workflow-published-state");
const workflow_serializer_1 = require("../entities/workflow/workflow.serializer");
const package_directory_inventory_reader_1 = require("../io/directory/package-directory-inventory-reader");
const manifest_entry_1 = require("../io/manifest-entry");
const manifest_schema_1 = require("../spec/manifest.schema");
const agent_schema_1 = require("../spec/serialized/agent.schema");
const credential_schema_1 = require("../spec/serialized/credential.schema");
const data_table_schema_1 = require("../spec/serialized/data-table.schema");
const folder_schema_1 = require("../spec/serialized/folder.schema");
const project_schema_1 = require("../spec/serialized/project.schema");
const variable_schema_1 = require("../spec/serialized/variable.schema");
const workflow_metadata_schema_1 = require("../spec/serialized/workflow-metadata.schema");
let N8nPackageParser = class N8nPackageParser {
    constructor(logger, nodeTypes, workflowSerializer) {
        this.logger = logger;
        this.nodeTypes = nodeTypes;
        this.workflowSerializer = workflowSerializer;
    }
    async getManifest(reader) {
        try {
            return manifest_schema_1.packageManifestSchema.parse(await reader.readManifest());
        }
        catch (error) {
            if (error instanceof errors_1.BadRequestError)
                throw error;
            if (error instanceof zod_1.ZodError)
                throw new errors_1.BadRequestError('Package manifest failed validation');
            throw new errors_1.BadRequestError('Failed to read package manifest');
        }
    }
    async getWorkflows(reader, basePrefix = '') {
        const manifest = await this.getManifest(reader);
        const folderTargetToId = new Map((manifest.folders ?? []).map((f) => [f.target, f.id]));
        const workflows = [];
        for (const entry of (0, package_layout_1.workflowsInScope)(manifest.workflows, basePrefix)) {
            const parentFolderId = (0, package_layout_1.deriveParentFolderId)(entry.target, folderTargetToId);
            workflows.push(await this.readWorkflow(reader, entry, parentFolderId));
        }
        return workflows;
    }
    async getAgents(reader, basePrefix = '') {
        const manifest = await this.getManifest(reader);
        const agents = [];
        for (const entry of manifest.agents ?? []) {
            if (!entry.target.startsWith(`${basePrefix}agents/`))
                continue;
            agents.push(await this.readAgent(reader, entry));
        }
        return agents;
    }
    async getFolders(reader, basePrefix = '') {
        const manifest = await this.getManifest(reader);
        const folders = [];
        for (const entry of (0, package_layout_1.foldersInScope)(manifest.folders, basePrefix)) {
            folders.push(await this.readFolder(reader, entry));
        }
        return folders;
    }
    async getDataTables(reader) {
        const manifest = await this.getManifest(reader);
        const dataTables = [];
        const seenColumnIds = new Set();
        for (const entry of manifest.dataTables ?? []) {
            const dataTable = await this.readDataTable(reader, entry);
            for (const { id } of dataTable.columns) {
                if (id)
                    (0, package_directory_inventory_reader_1.assertUnseen)(seenColumnIds, id, 'data table column id');
            }
            dataTables.push(dataTable);
        }
        return dataTables;
    }
    async getProjects(reader) {
        const manifest = await this.getManifest(reader);
        const projects = [];
        for (const entry of manifest.projects ?? []) {
            projects.push(await this.readProject(reader, entry));
        }
        return projects;
    }
    async getVariables(reader) {
        const manifest = await this.getManifest(reader);
        const variables = new Map();
        for (const entry of manifest.variables ?? []) {
            variables.set(entry.target, await this.readVariable(reader, entry));
        }
        return variables;
    }
    async getCredentials(reader, sourceIds) {
        const manifest = await this.getManifest(reader);
        const credentials = new Map();
        const requiredTypes = new Map((manifest.requirements?.credentials ?? []).map(({ id, type }) => [id, type]));
        for (const entry of manifest.credentials ?? []) {
            if (sourceIds && !sourceIds.has(entry.id))
                continue;
            credentials.set(entry.id, await this.readCredential(reader, entry, requiredTypes.get(entry.id)));
        }
        return credentials;
    }
    async readAgent(reader, entry) {
        const path = (0, manifest_entry_1.entityFilePath)('agents', entry.target);
        const agent = await this.readAgentFile(reader, path, agent_schema_1.serializedAgentSchema);
        if (agent.id !== entry.id) {
            throw new n8n_workflow_1.UserError(`Package Agent at ${path} declares id "${agent.id}" but the manifest lists "${entry.id}".`);
        }
        this.assertAgentBodiesPresent(agent, path);
        const metadata = await this.readAgentFile(reader, (0, manifest_entry_1.agentMetadataFilePath)(entry.target), agent_schema_1.serializedAgentMetadataSchema);
        await this.validateAgentTaskCrons(agent.id, agent.tasks);
        return {
            sourceAgentId: agent.id,
            name: agent.name,
            config: agent.config,
            availableInMCP: agent.availableInMCP,
            metadata,
            skills: agent.skills,
            tools: agent.tools,
            tasks: agent.tasks,
        };
    }
    async validateAgentTaskCrons(agentId, tasks) {
        if (Object.keys(tasks).length === 0)
            return;
        const { isValidCronExpression } = await import('../../../modules/agents/integrations/cron-validation.js');
        for (const [taskId, task] of Object.entries(tasks)) {
            if (!isValidCronExpression(task.cronExpression)) {
                throw new n8n_workflow_1.UserError(`Package Agent "${agentId}" task "${taskId}" has an invalid cron expression.`);
            }
        }
    }
    assertAgentBodiesPresent(agent, path) {
        const references = {
            skills: agent.config?.skills ?? [],
            tools: agent.config?.tools?.filter((tool) => tool.type === 'custom') ?? [],
            tasks: agent.config?.tasks ?? [],
        };
        for (const collection of ['skills', 'tools', 'tasks']) {
            const missing = references[collection].find(({ id }) => !Object.hasOwn(agent[collection], id));
            if (missing) {
                throw new n8n_workflow_1.UserError(`Package Agent at ${path} references ${collection} asset "${missing.id}" without a body.`);
            }
        }
    }
    async readAgentFile(reader, path, schema) {
        const wire = await this.readJson(reader, path, 'Agent');
        const result = schema.safeParse(wire);
        if (!result.success) {
            throw new n8n_workflow_1.UserError(`Package Agent file at ${path} failed schema validation.`, {
                cause: result.error,
            });
        }
        return result.data;
    }
    async readWorkflow(reader, entry, parentFolderId) {
        const path = (0, manifest_entry_1.entityFilePath)('workflows', entry.target);
        const wire = await this.readJson(reader, path, 'workflow');
        const metadata = await this.readWorkflowMetadata(reader, entry);
        let entity;
        try {
            entity = Object.assign(new db_1.WorkflowEntity(), this.workflowSerializer.deserialize(wire));
        }
        catch (cause) {
            if (cause instanceof zod_1.ZodError) {
                throw new n8n_workflow_1.UserError(`Package workflow file at ${path} failed schema validation.`, {
                    cause,
                });
            }
            throw cause;
        }
        WorkflowHelpers.validateWorkflowStructure(entity);
        this.normalizeNodeGroups(entity, path);
        const sourcePublished = (0, workflow_published_state_1.derivePublishedState)(metadata);
        return {
            entity,
            sourceWorkflowId: entry.id,
            parentFolderId,
            sourceArchived: entity.isArchived,
            ...(sourcePublished !== undefined ? { sourcePublished } : {}),
            ...(wire.tagIds !== undefined ? { tagIds: wire.tagIds } : {}),
        };
    }
    async readWorkflowMetadata(reader, entry) {
        const path = (0, manifest_entry_1.workflowMetadataFilePath)(entry.target);
        const wire = await this.readJson(reader, path, 'workflow metadata', `Package workflow metadata file is missing at ${path}. Export the package again from an instance that runs this version.`);
        try {
            return workflow_metadata_schema_1.serializedWorkflowMetadataSchema.parse(wire);
        }
        catch (cause) {
            if (cause instanceof zod_1.ZodError) {
                throw new n8n_workflow_1.UserError(`Package workflow metadata file at ${path} failed schema validation.`, {
                    cause,
                });
            }
            throw cause;
        }
    }
    normalizeNodeGroups(entity, path) {
        const dropped = WorkflowHelpers.dropInvalidWorkflowGroups(entity, WorkflowHelpers.makeGetNodeTypeForGrouping(this.nodeTypes));
        for (const { groupName, message } of dropped) {
            this.logger.warn(`Package workflow file at ${path} dropped group "${groupName}": ${message}`);
        }
        for (const warning of WorkflowHelpers.sanitizeNodeGroupDescriptions(entity)) {
            this.logger.warn(`Package workflow file at ${path}: ${warning}`);
        }
    }
    async readFolder(reader, entry) {
        const path = (0, manifest_entry_1.entityFilePath)('folders', entry.target);
        const wire = await this.readJson(reader, path, 'folder');
        let folder;
        try {
            folder = folder_schema_1.serializedFolderSchema.parse(wire);
        }
        catch (cause) {
            if (cause instanceof zod_1.ZodError) {
                throw new n8n_workflow_1.UserError(`Package folder file at ${path} failed schema validation.`, { cause });
            }
            throw cause;
        }
        if (folder.id !== entry.id) {
            throw new n8n_workflow_1.UserError(`Package folder at ${path} declares id "${folder.id}" but the manifest lists it as "${entry.id}".`);
        }
        return {
            sourceFolderId: folder.id,
            name: folder.name,
            parentFolderId: folder.parentFolderId,
        };
    }
    async readDataTable(reader, entry) {
        const path = (0, manifest_entry_1.entityFilePath)('dataTables', entry.target);
        const wire = await this.readJson(reader, path, 'data table');
        let dataTable;
        try {
            dataTable = data_table_schema_1.serializedDataTableSchema.parse(wire);
        }
        catch (cause) {
            if (cause instanceof zod_1.ZodError) {
                throw new n8n_workflow_1.UserError(`Package data table file at ${path} failed schema validation.`, {
                    cause,
                });
            }
            throw cause;
        }
        if (dataTable.id !== entry.id) {
            throw new n8n_workflow_1.UserError(`Package data table at ${path} declares id "${dataTable.id}" but the manifest lists it as "${entry.id}".`);
        }
        return dataTable;
    }
    async readProject(reader, entry) {
        const path = (0, manifest_entry_1.entityFilePath)('projects', entry.target);
        const wire = await this.readJson(reader, path, 'project');
        let project;
        try {
            project = project_schema_1.serializedProjectSchema.parse(wire);
        }
        catch (cause) {
            if (cause instanceof zod_1.ZodError) {
                throw new n8n_workflow_1.UserError(`Package project file at ${path} failed schema validation.`, { cause });
            }
            throw cause;
        }
        if (project.id !== entry.id) {
            throw new n8n_workflow_1.UserError(`Package project at ${path} declares id "${project.id}" but the manifest lists it as "${entry.id}".`);
        }
        return {
            sourceProjectId: project.id,
            name: project.name,
            ...(project.description !== undefined ? { description: project.description } : {}),
            ...(project.icon !== undefined ? { icon: project.icon } : {}),
            ...(project.customTelemetryTags !== undefined
                ? { customTelemetryTags: project.customTelemetryTags }
                : {}),
        };
    }
    async readVariable(reader, entry) {
        const path = (0, manifest_entry_1.entityFilePath)('variables', entry.target);
        const wire = await this.readJson(reader, path, 'variable');
        let variable;
        try {
            variable = variable_schema_1.serializedVariableSchema.parse(wire);
        }
        catch (cause) {
            if (cause instanceof zod_1.ZodError) {
                throw new n8n_workflow_1.UserError(`Package variable file at ${path} failed schema validation.`, {
                    cause,
                });
            }
            throw cause;
        }
        if (variable.name !== entry.name) {
            throw new n8n_workflow_1.UserError(`Package variable at ${path} declares name "${variable.name}" but the manifest lists it as "${entry.name}".`);
        }
        return variable;
    }
    async readCredential(reader, entry, requiredType) {
        const path = (0, manifest_entry_1.entityFilePath)('credentials', entry.target);
        const wire = await this.readJson(reader, path, 'credential');
        let credential;
        try {
            credential = credential_schema_1.serializedCredentialSchema.parse(wire);
        }
        catch (cause) {
            if (cause instanceof zod_1.ZodError) {
                throw new n8n_workflow_1.UserError(`Package credential file at ${path} failed schema validation.`, {
                    cause,
                });
            }
            throw cause;
        }
        if (credential.id !== entry.id) {
            throw new n8n_workflow_1.UserError(`Package credential at ${path} declares id "${credential.id}" but the manifest lists it as "${entry.id}".`);
        }
        if (credential.name !== entry.name) {
            throw new n8n_workflow_1.UserError(`Package credential at ${path} declares name "${credential.name}" but the manifest lists it as "${entry.name}".`);
        }
        if (requiredType !== undefined && credential.type !== requiredType) {
            throw new n8n_workflow_1.UserError(`Package credential at ${path} declares type "${credential.type}" but the requirement lists it as "${requiredType}".`);
        }
        return credential;
    }
    async readJson(reader, path, label, missingFileMessage) {
        let content;
        try {
            content = await reader.readFile(path);
        }
        catch (cause) {
            throw new n8n_workflow_1.UserError(missingFileMessage ?? `Package manifest references a missing ${label} file at ${path}.`, { cause });
        }
        return (0, n8n_workflow_1.jsonParse)(content.toString('utf-8'), {
            errorMessage: `Package ${label} file at ${path} is not valid JSON.`,
        });
    }
};
exports.N8nPackageParser = N8nPackageParser;
exports.N8nPackageParser = N8nPackageParser = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, node_types_1.NodeTypes, workflow_serializer_1.WorkflowSerializer])
], N8nPackageParser);
//# sourceMappingURL=n8n-package-parser.js.map