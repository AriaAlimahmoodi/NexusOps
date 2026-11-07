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
exports.AutoIncludedWorkflowExporter = void 0;
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const workflow_serializer_1 = require("./workflow.serializer");
const manifest_entry_1 = require("../../io/manifest-entry");
const credential_requirements_extractor_1 = require("../credential/credential-requirements.extractor");
const data_table_requirements_extractor_1 = require("../data-table/data-table-requirements.extractor");
const folder_serializer_1 = require("../folder/folder.serializer");
const project_shell_exporter_1 = require("../project/project-shell.exporter");
const tag_requirements_extractor_1 = require("../tag/tag-requirements.extractor");
const variable_requirements_extractor_1 = require("../variable/variable-requirements.extractor");
let AutoIncludedWorkflowExporter = class AutoIncludedWorkflowExporter {
    constructor(workflowSerializer, folderSerializer, projectShellExporter, credentialRequirementsExtractor, dataTableRequirementsExtractor, variableRequirementsExtractor, tagRequirementsExtractor) {
        this.workflowSerializer = workflowSerializer;
        this.folderSerializer = folderSerializer;
        this.projectShellExporter = projectShellExporter;
        this.credentialRequirementsExtractor = credentialRequirementsExtractor;
        this.dataTableRequirementsExtractor = dataTableRequirementsExtractor;
        this.variableRequirementsExtractor = variableRequirementsExtractor;
        this.tagRequirementsExtractor = tagRequirementsExtractor;
    }
    async export(request) {
        const workflowEntriesById = new Map(request.existingWorkflowEntries.map((entry) => [entry.id, entry]));
        const shells = {
            writer: request.writer,
            folderEntriesById: new Map(request.existingFolderEntries.map((entry) => [entry.id, entry])),
            projectTargetsById: new Map([
                ...(request.projectTargetsById ?? []),
                ...request.existingProjectEntries.map((entry) => [entry.id, entry.target]),
            ]),
            folderEntries: [],
            projectEntries: [],
        };
        const workflowEntries = [];
        const credentials = [];
        const dataTables = [];
        const variables = [];
        const tags = [];
        const nodeTypes = [];
        for (const included of request.workflows) {
            if (workflowEntriesById.has(included.workflow.id))
                continue;
            const entry = await (0, manifest_entry_1.writeWorkflowManifestEntry)(request.writer, await this.resolveWorkflowBaseDir(included, shells), included.workflow, this.workflowSerializer.serialize(included.workflow, { includeTags: request.includeTags }), this.workflowSerializer.serializeMetadata(included.workflow));
            workflowEntries.push(entry);
            workflowEntriesById.set(entry.id, entry);
            credentials.push(...this.credentialRequirementsExtractor.extractFromWorkflow(included.workflow));
            dataTables.push(...this.dataTableRequirementsExtractor.extract(included.workflow));
            variables.push(...this.variableRequirementsExtractor.extract(included.workflow));
            tags.push(...this.tagRequirementsExtractor.extract(included.workflow));
            nodeTypes.push({
                workflowId: included.workflow.id,
                nodes: included.workflow.nodes ?? [],
            });
        }
        return {
            workflowEntries,
            folderEntries: shells.folderEntries,
            projectEntries: shells.projectEntries,
            requirements: { credentials, dataTables, variables, tags, nodeTypes },
            projectTargetsById: shells.projectTargetsById,
        };
    }
    async resolveWorkflowBaseDir(included, shells) {
        const scope = included.placement === 'project'
            ? await this.projectShellExporter.export(included.ownerProject, shells)
            : undefined;
        const chain = included.placement === 'top-level' ? [] : included.folderChain;
        const container = chain.length > 0
            ? await this.ensureFolderChain(chain, (0, manifest_entry_1.packageDirectory)('folders', scope), shells)
            : scope;
        return (0, manifest_entry_1.packageDirectory)('workflows', container);
    }
    async ensureFolderChain(chain, baseDir, shells) {
        let parentTarget;
        let effectiveParentId = null;
        for (const folder of chain) {
            const existing = shells.folderEntriesById.get(folder.id);
            if (existing) {
                parentTarget = existing.target;
                effectiveParentId = folder.id;
                continue;
            }
            const entry = await (0, manifest_entry_1.writeManifestEntry)(shells.writer, 'folders', parentTarget ?? baseDir, folder, this.folderSerializer.serialize(folder, effectiveParentId));
            shells.folderEntries.push(entry);
            shells.folderEntriesById.set(entry.id, entry);
            parentTarget = entry.target;
            effectiveParentId = folder.id;
        }
        if (!parentTarget) {
            throw new n8n_workflow_1.UnexpectedError('Cannot place workflow in an empty folder chain', {
                extra: { baseDir, folderIds: chain.map((folder) => folder.id) },
            });
        }
        return parentTarget;
    }
};
exports.AutoIncludedWorkflowExporter = AutoIncludedWorkflowExporter;
exports.AutoIncludedWorkflowExporter = AutoIncludedWorkflowExporter = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [workflow_serializer_1.WorkflowSerializer, folder_serializer_1.FolderSerializer, project_shell_exporter_1.ProjectShellExporter, credential_requirements_extractor_1.CredentialRequirementsExtractor, data_table_requirements_extractor_1.DataTableRequirementsExtractor, variable_requirements_extractor_1.VariableRequirementsExtractor, tag_requirements_extractor_1.TagRequirementsExtractor])
], AutoIncludedWorkflowExporter);
//# sourceMappingURL=auto-included-workflow.exporter.js.map