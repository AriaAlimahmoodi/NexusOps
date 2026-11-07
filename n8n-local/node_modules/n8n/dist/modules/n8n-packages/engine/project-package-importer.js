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
exports.ProjectPackageImporter = void 0;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const errors_1 = require("@n8n/errors");
const credential_conflict_policy_1 = require("../entities/credential/credential-conflict-policy");
const credential_missing_mode_1 = require("../entities/credential/credential-missing-mode");
const folder_conflict_policy_1 = require("../entities/folder/folder-conflict-policy");
const project_importer_1 = require("../entities/project/project-importer");
const workflow_importer_1 = require("../entities/workflow/workflow-importer");
const workflow_publisher_1 = require("../entities/workflow/workflow-publisher");
const n8n_packages_types_1 = require("../n8n-packages.types");
const import_gates_1 = require("./import-gates");
const import_blocked_error_1 = require("./import-blocked.error");
const package_layout_1 = require("./package-layout");
const import_orchestrator_1 = require("./import-orchestrator");
const import_result_1 = require("./import-result");
const n8n_package_parser_1 = require("./n8n-package-parser");
let ProjectPackageImporter = class ProjectPackageImporter {
    constructor(packageParser, projectImporter, importOrchestrator, workflowPublisher, licenseState) {
        this.packageParser = packageParser;
        this.projectImporter = projectImporter;
        this.importOrchestrator = importOrchestrator;
        this.workflowPublisher = workflowPublisher;
        this.licenseState = licenseState;
    }
    async import(request, reader, manifest, importSource) {
        this.assertAdequatePermissions(request, manifest);
        const { selection } = request;
        const selectedProjects = selection
            ? (manifest.projects ?? []).filter((project) => project.id === selection.selectedProjectId)
            : (manifest.projects ?? []);
        const allProjects = await this.packageParser.getProjects(reader);
        const projects = selection
            ? allProjects.filter((project) => project.sourceProjectId === selection.selectedProjectId)
            : allProjects;
        const projectPlan = await this.projectImporter.plan(request.user, projects, request.projectConflictPolicy);
        if (projectPlan.conflicts.length > 0) {
            throw (0, import_blocked_error_1.toImportBlockedError)(projectPlan.conflicts.map((conflict) => ({ type: 'project-conflict', ...conflict })));
        }
        const bundledVariables = (0, package_layout_1.needsBundledVariableValues)(request, (manifest.requirements?.variables?.length ?? 0) > 0)
            ? await this.packageParser.getVariables(reader)
            : undefined;
        const packageCredentials = (0, package_layout_1.needsBundledCredentialFiles)(request, (manifest.requirements?.credentials?.length ?? 0) > 0)
            ? await this.packageParser.getCredentials(reader)
            : undefined;
        const updateScope = (0, credential_conflict_policy_1.credentialUpdateScope)(selectedProjects.map(({ id }) => id));
        const pendingCreateIds = new Set(projectPlan.items
            .filter((item) => item.action === 'create')
            .map((item) => item.sourceProjectId));
        const planned = [];
        for (const project of selectedProjects) {
            const input = await this.buildImportContextForProject(request, reader, manifest, project, pendingCreateIds.has(project.id), { bundledVariables, packageCredentials, credentialUpdateScope: updateScope }, importSource);
            const plan = await this.importOrchestrator.plan(input);
            planned.push({ project, plan });
        }
        const missingCredentialIds = new Set(planned.flatMap(({ plan }) => plan.credentialPlan.failures.filter(credential_missing_mode_1.canStubNotFoundFailure).map(({ sourceId }) => sourceId)));
        if ((0, package_layout_1.needsBundledCredentialData)(request, missingCredentialIds.size > 0)) {
            const bundledCredentials = packageCredentials ??
                (await this.packageParser.getCredentials(reader, missingCredentialIds));
            for (const { plan } of planned) {
                const { credentialRequest } = plan.input;
                credentialRequest.requirements = (0, package_layout_1.placeCredentialData)({
                    requirements: credentialRequest.requirements,
                    bundledCredentials,
                });
            }
        }
        (0, import_gates_1.assertTagWritesAllowed)(request.apiKeyScopes, planned.map(({ plan }) => plan.tagPlan));
        (0, import_gates_1.assertArchiveTransitionsAllowed)(request.apiKeyScopes, planned.map(({ plan }) => plan.workflowPlan));
        await this.importOrchestrator.assertNotBlocked(planned.map(({ plan }) => plan), { apiKeyScopes: request.apiKeyScopes });
        const projectSummaries = await this.projectImporter.apply(request.user, projectPlan.items);
        const packageWorkflowBindings = new Map(planned.flatMap(({ plan }) => [...(0, workflow_importer_1.collectPlannedWorkflowBindings)(plan.workflowPlan.items)]));
        const applied = [];
        for (const { project, plan } of planned) {
            applied.push({
                project,
                plan,
                content: await this.importOrchestrator.apply(plan, packageWorkflowBindings),
            });
        }
        const published = await this.workflowPublisher.applyToPackage({
            user: request.user,
            persisted: applied.flatMap(({ content }) => content.workflowOutcomes),
            policy: request.workflowPublishingPolicy,
            subWorkflowRequirements: manifest.requirements?.workflows,
        });
        const workflows = [];
        const removedWorkflows = [];
        const removedFolders = [];
        const folders = [];
        const scopedBindings = [];
        const matched = [];
        const stubbed = [];
        let dataTablesMatched = 0;
        let dataTablesCreated = 0;
        let dataTablesUpdated = 0;
        const seeded = [];
        const incomplete = [];
        const variablesMatched = [];
        const variablesMissing = [];
        const variablesCreated = [];
        const variablesStubbed = [];
        const variablesSkipped = [];
        const variablesUpdated = [];
        const tagSummaries = [];
        const scopes = [];
        for (const { project, plan, content } of applied) {
            workflows.push(...(0, import_result_1.toImportedWorkflowSummaries)(content.workflowOutcomes, project.id, published));
            removedWorkflows.push(...content.removedWorkflows);
            removedFolders.push(...content.removedFolders);
            folders.push(...content.folderSummaries);
            scopedBindings.push(content.bindings);
            matched.push(...content.credentialResult.matched);
            stubbed.push(...content.credentialResult.stubbed);
            dataTablesMatched += content.dataTablePlan.matchedCount;
            dataTablesCreated += content.dataTablePlan.creations.length;
            dataTablesUpdated += content.dataTablePlan.updates.length;
            seeded.push(...content.credentialResult.seeded);
            incomplete.push(...content.credentialResult.incomplete);
            variablesMatched.push(...content.variablePlan.matched);
            variablesMissing.push(...content.variablePlan.missing.map(({ name }) => name));
            variablesCreated.push(...content.variableResult.created);
            variablesStubbed.push(...content.variableResult.stubbed);
            variablesSkipped.push(...content.variableResult.skippedExisting);
            variablesUpdated.push(...content.variableResult.updated);
            tagSummaries.push((0, import_result_1.toTagSummary)(content.tagPlan));
            scopes.push({
                context: plan.input.context,
                imported: content,
                credentialRequest: plan.input.credentialRequest,
                dataTableRequest: plan.input.dataTableRequest,
                variableRequest: plan.input.variableRequest,
                tagRequest: plan.input.tagRequest,
            });
        }
        const result = (0, import_result_1.buildImportResult)({
            package: (0, import_result_1.toPackageSummary)(manifest),
            workflows,
            removedWorkflows,
            removedFolders,
            folders,
            projects: projectSummaries,
            bindings: (0, n8n_packages_types_1.mergeBindings)(...scopedBindings),
            credentials: { matched, stubbed, seeded, incomplete },
            dataTables: {
                matched: dataTablesMatched,
                created: dataTablesCreated,
                updated: dataTablesUpdated,
            },
            variables: (0, import_result_1.reconcileVariableSummary)({
                matched: variablesMatched,
                missing: variablesMissing,
                created: variablesCreated,
                stubbed: variablesStubbed,
                skipped: variablesSkipped,
                updated: variablesUpdated,
            }),
            tags: (0, import_result_1.unionTagSummaries)(tagSummaries),
        });
        return { result, scopes };
    }
    async buildImportContextForProject(request, reader, manifest, project, projectPendingCreation, importWide, importSource) {
        const basePrefix = `${project.target}/`;
        const folders = await this.packageParser.getFolders(reader, basePrefix);
        const allWorkflows = await this.packageParser.getWorkflows(reader, basePrefix);
        const workflows = request.selection
            ? allWorkflows.filter((workflow) => request.selection.selectedWorkflowIds.includes(workflow.sourceWorkflowId))
            : allWorkflows;
        const requirements = (0, import_result_1.identifyRequirements)(manifest.requirements?.credentials, workflows);
        const credentialRequest = {
            requirements,
            matchingMode: request.credentialMatchingMode,
            missingMode: request.credentialMissingMode,
            credentialBindings: (0, import_result_1.scopeCredentialBindingsToRequirements)(request.bindings?.credentials, requirements),
            conflictPolicy: (0, credential_conflict_policy_1.resolveCredentialConflictPolicy)(request.credentialConflictPolicy),
            packageCredentials: importWide.packageCredentials,
            updateScope: importWide.credentialUpdateScope,
        };
        const dataTableRequest = {
            requirements: (0, import_result_1.identifyRequirements)(manifest.requirements?.dataTables, workflows),
            packageDataTables: await this.packageParser.getDataTables(reader),
            matchingMode: request.dataTableMatchingMode,
            missingMode: request.dataTableMissingMode,
            schemaConflictPolicy: request.dataTableSchemaConflictPolicy,
        };
        const variableRequest = {
            requirements: (0, package_layout_1.placeByLayout)({
                requirements: (0, import_result_1.identifyRequirements)(manifest.requirements?.variables, workflows),
                manifestVariables: manifest.variables,
                scopePrefix: basePrefix,
                bundledVariables: importWide.bundledVariables,
            }),
            missingMode: request.variableMissingMode,
            conflictPolicy: request.variableConflictPolicy,
        };
        const tagRequest = {
            requirements: manifest.requirements?.tags,
            missingMode: request.tagMissingMode,
            conflictPolicy: request.tagConflictPolicy,
        };
        return {
            context: {
                user: request.user,
                projectId: project.id,
                folderId: null,
            },
            folders,
            workflows,
            credentialRequest,
            dataTableRequest,
            variableRequest,
            tagRequest,
            options: request,
            projectPendingCreation,
            importSource,
            subWorkflowRequirements: (0, import_result_1.identifyRequirements)(manifest.requirements?.workflows, workflows),
            explicitDeleteWorkflowIds: deletesForProject(request.selection, project.id),
        };
    }
    assertAdequatePermissions(request, manifest) {
        (0, import_gates_1.assertPackageImportApiKeyScopes)(request.apiKeyScopes, ['project:create', 'project:update']);
        if ((manifest.folders?.length ?? 0) > 0) {
            if (!this.licenseState.isLicensed('feat:folders')) {
                throw new errors_1.ForbiddenError('Your license does not allow folders. Importing a package with folders requires a license that supports folders.');
            }
            (0, import_gates_1.assertPackageImportApiKeyScopes)(request.apiKeyScopes, ['folder:create', 'folder:update']);
        }
        if ((manifest.workflows?.length ?? 0) > 0) {
            (0, import_gates_1.assertPackageImportApiKeyScopes)(request.apiKeyScopes, ['workflow:import']);
        }
        if ((0, folder_conflict_policy_1.removesUnpackagedWorkflows)(request.folderConflictPolicy)) {
            (0, import_gates_1.assertPackageImportApiKeyScopes)(request.apiKeyScopes, ['workflow:delete', 'folder:delete']);
        }
        if (request.selection?.deletedWorkflowIds?.length) {
            (0, import_gates_1.assertPackageImportApiKeyScopes)(request.apiKeyScopes, ['workflow:delete']);
        }
    }
};
exports.ProjectPackageImporter = ProjectPackageImporter;
exports.ProjectPackageImporter = ProjectPackageImporter = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [n8n_package_parser_1.N8nPackageParser, project_importer_1.ProjectImporter, import_orchestrator_1.ImportOrchestrator, workflow_publisher_1.WorkflowPublisher, backend_common_1.LicenseState])
], ProjectPackageImporter);
function deletesForProject(selection, projectId) {
    if (!selection || selection.selectedProjectId !== projectId)
        return undefined;
    return selection.deletedWorkflowIds;
}
//# sourceMappingURL=project-package-importer.js.map