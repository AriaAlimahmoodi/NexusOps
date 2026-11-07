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
exports.WorkflowExporter = void 0;
const di_1 = require("@n8n/di");
const workflow_finder_service_1 = require("../../../../workflows/workflow-finder.service");
const workflow_serializer_1 = require("./workflow.serializer");
const workflow_version_policy_1 = require("./workflow-version-policy");
const manifest_entry_1 = require("../../io/manifest-entry");
const credential_requirements_extractor_1 = require("../credential/credential-requirements.extractor");
const data_table_requirements_extractor_1 = require("../data-table/data-table-requirements.extractor");
const package_export_errors_1 = require("../package-export.errors");
const tag_requirements_extractor_1 = require("../tag/tag-requirements.extractor");
const variable_requirements_extractor_1 = require("../variable/variable-requirements.extractor");
let WorkflowExporter = class WorkflowExporter {
    constructor(workflowFinder, workflowSerializer, credentialRequirementsExtractor, dataTableRequirementsExtractor, variableRequirementsExtractor, tagRequirementsExtractor) {
        this.workflowFinder = workflowFinder;
        this.workflowSerializer = workflowSerializer;
        this.credentialRequirementsExtractor = credentialRequirementsExtractor;
        this.dataTableRequirementsExtractor = dataTableRequirementsExtractor;
        this.variableRequirementsExtractor = variableRequirementsExtractor;
        this.tagRequirementsExtractor = tagRequirementsExtractor;
    }
    async export(request) {
        const workflows = await this.workflowFinder.findWorkflowsByIdsForUser(request.workflowIds, request.user, ['workflow:export'], {
            includeParentFolder: true,
            includeTags: request.includeTags,
            includeActiveVersion: (0, workflow_version_policy_1.needsActiveVersion)(request.versionPolicy),
        });
        await (0, package_export_errors_1.assertEveryRequestedEntityAccessible)('workflow', request.workflowIds, workflows, async (ids) => await this.workflowFinder.findExistingWorkflowIds(ids));
        const workflowsForExport = this.orderWorkflowsByRequest(request.workflowIds, (0, workflow_version_policy_1.applyWorkflowVersionPolicy)(workflows, request.versionPolicy));
        const entries = [];
        const credentials = [];
        const dataTables = [];
        const variables = [];
        const tags = [];
        const nodeTypes = [];
        const workflowsDir = (0, manifest_entry_1.packageDirectory)('workflows', request.basePrefix);
        for (const workflow of workflowsForExport) {
            entries.push(await (0, manifest_entry_1.writeWorkflowManifestEntry)(request.writer, workflowsDir, workflow, this.workflowSerializer.serialize(workflow, { includeTags: request.includeTags }), this.workflowSerializer.serializeMetadata(workflow)));
            credentials.push(...this.credentialRequirementsExtractor.extractFromWorkflow(workflow));
            dataTables.push(...this.dataTableRequirementsExtractor.extract(workflow));
            variables.push(...this.variableRequirementsExtractor.extract(workflow));
            tags.push(...this.tagRequirementsExtractor.extract(workflow));
            nodeTypes.push({ workflowId: workflow.id, nodes: workflow.nodes ?? [] });
        }
        return { entries, requirements: { credentials, dataTables, variables, tags, nodeTypes } };
    }
    orderWorkflowsByRequest(workflowIds, workflows) {
        const workflowsById = new Map(workflows.map((workflow) => [workflow.id, workflow]));
        const seen = new Set();
        const orderedWorkflows = [];
        for (const workflowId of workflowIds) {
            if (seen.has(workflowId))
                continue;
            const workflow = workflowsById.get(workflowId);
            if (!workflow)
                continue;
            seen.add(workflowId);
            orderedWorkflows.push(workflow);
        }
        return orderedWorkflows;
    }
};
exports.WorkflowExporter = WorkflowExporter;
exports.WorkflowExporter = WorkflowExporter = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [workflow_finder_service_1.WorkflowFinderService, workflow_serializer_1.WorkflowSerializer, credential_requirements_extractor_1.CredentialRequirementsExtractor, data_table_requirements_extractor_1.DataTableRequirementsExtractor, variable_requirements_extractor_1.VariableRequirementsExtractor, tag_requirements_extractor_1.TagRequirementsExtractor])
], WorkflowExporter);
//# sourceMappingURL=workflow.exporter.js.map