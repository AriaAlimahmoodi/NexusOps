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
exports.PackageDirectoryInventoryReader = void 0;
exports.assertUnseen = assertUnseen;
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const zod_1 = require("zod");
const workflow_serializer_1 = require("../../entities/workflow/workflow.serializer");
const credential_schema_1 = require("../../spec/serialized/credential.schema");
const data_table_schema_1 = require("../../spec/serialized/data-table.schema");
const project_schema_1 = require("../../spec/serialized/project.schema");
const variable_schema_1 = require("../../spec/serialized/variable.schema");
const workflow_schema_1 = require("../../spec/serialized/workflow.schema");
const manifest_entry_1 = require("../manifest-entry");
const KIND_BY_FILE_NAME = {
    [manifest_entry_1.PACKAGE_ENTITY_LAYOUT.projects.fileName]: 'projects',
    [manifest_entry_1.PACKAGE_ENTITY_LAYOUT.workflows.fileName]: 'workflows',
    [manifest_entry_1.PACKAGE_ENTITY_LAYOUT.credentials.fileName]: 'credentials',
    [manifest_entry_1.PACKAGE_ENTITY_LAYOUT.variables.fileName]: 'variables',
    [manifest_entry_1.PACKAGE_ENTITY_LAYOUT.dataTables.fileName]: 'dataTables',
};
const LABELS = {
    projects: 'project',
    workflows: 'workflow',
    credentials: 'credential',
    variables: 'variable',
    dataTables: 'data table',
};
let PackageDirectoryInventoryReader = class PackageDirectoryInventoryReader {
    constructor(workflowSerializer) {
        this.workflowSerializer = workflowSerializer;
    }
    async read(source) {
        const files = (await source.listEntries()).sort().flatMap((path) => classify(path) ?? []);
        const projects = await this.readProjects(source, files);
        const projectIdByDir = new Map(projects.map((project) => [project.path, project.id]));
        const projectIdOf = (file) => {
            if (file.projectDir === null)
                return null;
            const projectId = projectIdByDir.get(file.projectDir);
            if (projectId === undefined) {
                throw new n8n_workflow_1.UserError(`Package file at ${file.path} is inside "${file.projectDir}", which has no ${manifest_entry_1.PACKAGE_ENTITY_LAYOUT.projects.fileName}.`);
            }
            return projectId;
        };
        return {
            projects,
            workflows: await this.readWorkflows(source, files, projectIdOf),
            credentials: await this.readCredentials(source, files, projectIdOf),
            variables: await this.readVariables(source, files, projectIdOf),
            dataTables: await this.readDataTables(source, files, projectIdOf),
        };
    }
    async readProjects(source, files) {
        const projects = [];
        const seenIds = new Set();
        for (const file of files.filter((f) => f.kind === 'projects')) {
            if (file.projectDir === null || file.segments.length !== 1) {
                throw unsupportedLocation(file);
            }
            const project = await this.readEntity(source, file, project_schema_1.serializedProjectSchema);
            assertUnseen(seenIds, project.id, 'project id');
            projects.push({ path: file.projectDir, ...project });
        }
        return projects;
    }
    async readWorkflows(source, files, projectIdOf) {
        const workflows = [];
        const seenIds = new Set();
        for (const file of files.filter((f) => f.kind === 'workflows')) {
            if (!isWorkflowLocation(file.segments))
                throw unsupportedLocation(file);
            const projectId = projectIdOf(file);
            if (projectId === null) {
                throw new n8n_workflow_1.UserError(`Package workflow file at ${file.path} is not inside a project.`);
            }
            const serialized = await this.readEntity(source, file, workflow_schema_1.serializedWorkflowSchema);
            assertUnseen(seenIds, serialized.id, 'workflow id');
            workflows.push({
                path: file.path,
                projectId,
                id: serialized.id,
                name: serialized.name,
                content: this.workflowSerializer.deserialize(serialized),
            });
        }
        return workflows;
    }
    async readCredentials(source, files, projectIdOf) {
        const credentials = [];
        const seenIds = new Set();
        for (const file of files.filter((f) => f.kind === 'credentials')) {
            if (!isCollectionLocation(file.segments, 'credentials'))
                throw unsupportedLocation(file);
            const credential = await this.readEntity(source, file, credential_schema_1.serializedCredentialSchema);
            assertUnseen(seenIds, credential.id, 'credential id');
            credentials.push({ path: file.path, projectId: projectIdOf(file), credential });
        }
        return credentials;
    }
    async readVariables(source, files, projectIdOf) {
        const variables = [];
        const seenNames = new Set();
        for (const file of files.filter((f) => f.kind === 'variables')) {
            if (!isCollectionLocation(file.segments, 'variables'))
                throw unsupportedLocation(file);
            const projectId = projectIdOf(file);
            const variable = await this.readEntity(source, file, variable_schema_1.serializedVariableSchema);
            assertUnseen(seenNames, JSON.stringify([projectId, variable.name]), 'variable name in one scope', `${projectId ?? ''}/${variable.name}`);
            variables.push({ path: file.path, projectId, variable });
        }
        return variables;
    }
    async readDataTables(source, files, projectIdOf) {
        const dataTables = [];
        const seenIds = new Set();
        const seenColumnIds = new Set();
        for (const file of files.filter((f) => f.kind === 'dataTables')) {
            if (!isCollectionLocation(file.segments, 'dataTables'))
                throw unsupportedLocation(file);
            projectIdOf(file);
            const dataTable = await this.readEntity(source, file, data_table_schema_1.serializedDataTableSchema);
            assertUnseen(seenIds, dataTable.id, 'data table id');
            for (const { id } of dataTable.columns) {
                if (id)
                    assertUnseen(seenColumnIds, id, 'data table column id');
            }
            dataTables.push({ path: file.path, dataTable });
        }
        return dataTables;
    }
    async readEntity(source, file, schema) {
        const label = LABELS[file.kind];
        const raw = await source.readFile(file.path);
        const wire = (0, n8n_workflow_1.jsonParse)(raw.toString('utf-8'), {
            errorMessage: `Package ${label} file at ${file.path} is not valid JSON.`,
        });
        try {
            return schema.parse(wire);
        }
        catch (cause) {
            if (cause instanceof zod_1.ZodError) {
                throw new n8n_workflow_1.UserError(`Package ${label} file at ${file.path} failed schema validation.`, {
                    cause,
                });
            }
            throw cause;
        }
    }
};
exports.PackageDirectoryInventoryReader = PackageDirectoryInventoryReader;
exports.PackageDirectoryInventoryReader = PackageDirectoryInventoryReader = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [workflow_serializer_1.WorkflowSerializer])
], PackageDirectoryInventoryReader);
function classify(path) {
    const segments = path.split('/');
    const kind = KIND_BY_FILE_NAME[segments[segments.length - 1]];
    if (kind === undefined)
        return undefined;
    const projectsDir = manifest_entry_1.PACKAGE_ENTITY_LAYOUT.projects.directory;
    if (segments[0] === projectsDir && segments.length > 2) {
        return {
            path,
            kind,
            projectDir: `${projectsDir}/${segments[1]}`,
            segments: segments.slice(2),
        };
    }
    return { path, kind, projectDir: null, segments };
}
function isCollectionLocation(segments, kind) {
    return segments.length === 3 && segments[0] === manifest_entry_1.PACKAGE_ENTITY_LAYOUT[kind].directory;
}
function isWorkflowLocation(segments) {
    if (!isCollectionLocation(segments.slice(-3), 'workflows'))
        return false;
    const container = segments.slice(0, -3);
    if (container.length === 0)
        return true;
    return container[0] === manifest_entry_1.PACKAGE_ENTITY_LAYOUT.folders.directory && container.length >= 2;
}
function unsupportedLocation(file) {
    return new n8n_workflow_1.UserError(`Package ${LABELS[file.kind]} file at ${file.path} is not in a supported location.`);
}
function assertUnseen(seen, key, label, displayKey = key) {
    if (seen.has(key))
        throw new n8n_workflow_1.UserError(`Package contains a duplicate ${label}: ${displayKey}`);
    seen.add(key);
}
//# sourceMappingURL=package-directory-inventory-reader.js.map