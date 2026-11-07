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
exports.WorkflowPackageImporter = void 0;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const errors_1 = require("@n8n/errors");
const folder_service_1 = require("../../../services/folder.service");
const project_service_ee_1 = require("../../../services/project.service.ee");
const credential_conflict_policy_1 = require("../entities/credential/credential-conflict-policy");
const credential_missing_mode_1 = require("../entities/credential/credential-missing-mode");
const workflow_publisher_1 = require("../entities/workflow/workflow-publisher");
const n8n_packages_types_1 = require("../n8n-packages.types");
const import_gates_1 = require("./import-gates");
const import_orchestrator_1 = require("./import-orchestrator");
const import_result_1 = require("./import-result");
const n8n_package_parser_1 = require("./n8n-package-parser");
const package_layout_1 = require("./package-layout");
let WorkflowPackageImporter = class WorkflowPackageImporter {
    constructor(packageParser, importOrchestrator, workflowPublisher, projectService, folderService, licenseState) {
        this.packageParser = packageParser;
        this.importOrchestrator = importOrchestrator;
        this.workflowPublisher = workflowPublisher;
        this.projectService = projectService;
        this.folderService = folderService;
        this.licenseState = licenseState;
    }
    async import(request, reader, manifest) {
        const folders = await this.packageParser.getFolders(reader);
        if (folders.length > 0) {
            this.assertFoldersLicensed();
            (0, import_gates_1.assertPackageImportApiKeyScopes)(request.apiKeyScopes, ['folder:create', 'folder:update']);
        }
        const context = await this.findImportLocation(request.user, request.projectId, request.folderId, folders.length > 0);
        const workflows = await this.packageParser.getWorkflows(reader);
        const credentialRequirements = (0, import_result_1.identifyRequirements)(manifest.requirements?.credentials, workflows);
        const credentialRequest = {
            requirements: credentialRequirements,
            matchingMode: request.credentialMatchingMode,
            missingMode: request.credentialMissingMode,
            credentialBindings: request.bindings?.credentials,
            conflictPolicy: (0, credential_conflict_policy_1.resolveCredentialConflictPolicy)(request.credentialConflictPolicy),
            packageCredentials: (0, package_layout_1.needsBundledCredentialFiles)(request, (credentialRequirements?.length ?? 0) > 0)
                ? await this.packageParser.getCredentials(reader)
                : undefined,
            updateScope: (0, credential_conflict_policy_1.credentialUpdateScope)([context.projectId]),
        };
        const dataTableRequirements = (0, import_result_1.identifyRequirements)(manifest.requirements?.dataTables, workflows);
        if (dataTableRequirements?.length && request.dataTableMissingMode === 'create') {
            (0, import_gates_1.assertPackageImportApiKeyScopes)(request.apiKeyScopes, ['dataTable:create']);
        }
        const dataTableRequest = {
            requirements: dataTableRequirements,
            packageDataTables: await this.packageParser.getDataTables(reader),
            matchingMode: request.dataTableMatchingMode,
            missingMode: request.dataTableMissingMode,
            schemaConflictPolicy: request.dataTableSchemaConflictPolicy,
        };
        const variableRequirements = (0, import_result_1.identifyRequirements)(manifest.requirements?.variables, workflows);
        const bundledVariables = (0, package_layout_1.needsBundledVariableValues)(request, (variableRequirements?.length ?? 0) > 0)
            ? await this.packageParser.getVariables(reader)
            : undefined;
        const variableRequest = {
            requirements: (0, package_layout_1.placeByPolicy)({
                requirements: variableRequirements,
                manifestVariables: manifest.variables,
                policy: request.variableParentPolicy ?? n8n_packages_types_1.VariableParentPolicy.Project,
                bundledVariables,
            }),
            missingMode: request.variableMissingMode,
            conflictPolicy: request.variableConflictPolicy,
        };
        const tagRequest = {
            requirements: manifest.requirements?.tags,
            missingMode: request.tagMissingMode,
            conflictPolicy: request.tagConflictPolicy,
        };
        const plan = await this.importOrchestrator.plan({
            context,
            folders,
            workflows,
            credentialRequest,
            dataTableRequest,
            variableRequest,
            tagRequest,
            options: request,
            subWorkflowRequirements: (0, import_result_1.identifyRequirements)(manifest.requirements?.workflows, workflows),
        });
        const missingCredentialIds = new Set(plan.credentialPlan.failures.filter(credential_missing_mode_1.canStubNotFoundFailure).map(({ sourceId }) => sourceId));
        if ((0, package_layout_1.needsBundledCredentialData)(request, missingCredentialIds.size > 0)) {
            credentialRequest.requirements = (0, package_layout_1.placeCredentialData)({
                requirements: credentialRequirements,
                bundledCredentials: credentialRequest.packageCredentials ??
                    (await this.packageParser.getCredentials(reader, missingCredentialIds)),
            });
        }
        (0, import_gates_1.assertTagWritesAllowed)(request.apiKeyScopes, [plan.tagPlan]);
        (0, import_gates_1.assertArchiveTransitionsAllowed)(request.apiKeyScopes, [plan.workflowPlan]);
        await this.importOrchestrator.assertNotBlocked([plan], { apiKeyScopes: request.apiKeyScopes });
        const content = await this.importOrchestrator.apply(plan);
        const published = await this.workflowPublisher.applyToPackage({
            user: request.user,
            persisted: content.workflowOutcomes,
            policy: request.workflowPublishingPolicy,
            subWorkflowRequirements: plan.input.subWorkflowRequirements,
        });
        const scopes = [
            {
                context,
                imported: content,
                credentialRequest,
                dataTableRequest,
                variableRequest,
                tagRequest,
            },
        ];
        const result = (0, import_result_1.buildImportResult)({
            package: (0, import_result_1.toPackageSummary)(manifest),
            workflows: (0, import_result_1.toImportedWorkflowSummaries)(content.workflowOutcomes, context.projectId, published),
            removedWorkflows: content.removedWorkflows,
            removedFolders: content.removedFolders,
            folders: content.folderSummaries,
            projects: [],
            bindings: content.bindings,
            credentials: {
                matched: content.credentialResult.matched,
                stubbed: content.credentialResult.stubbed,
                seeded: content.credentialResult.seeded,
                incomplete: content.credentialResult.incomplete,
            },
            dataTables: {
                matched: content.dataTablePlan.matchedCount,
                created: content.dataTablePlan.creations.length,
                updated: content.dataTablePlan.updates.length,
            },
            variables: (0, import_result_1.toVariableSummary)(content.variablePlan, content.variableResult),
            tags: (0, import_result_1.toTagSummary)(content.tagPlan),
        });
        return { result, scopes };
    }
    assertFoldersLicensed() {
        if (!this.licenseState.isLicensed('feat:folders')) {
            throw new errors_1.ForbiddenError('Your license does not allow folders. Importing a package with folders requires a license that supports folders.');
        }
    }
    async findImportLocation(user, projectId, folderId, needsFolderCreate) {
        const scopes = needsFolderCreate
            ? ['workflow:import', 'folder:create', 'folder:update']
            : ['workflow:import'];
        const project = await this.resolveImportProject(user, projectId, scopes);
        await this.assertFolderExistsInProject(folderId, project.id);
        return { user, projectId: project.id, folderId: folderId ?? null };
    }
    async resolveImportProject(user, projectId, scopes) {
        if (projectId === undefined) {
            const personalProject = await this.projectService.getPersonalProject(user);
            if (!personalProject) {
                throw new errors_1.NotFoundError('Personal project not found');
            }
            return personalProject;
        }
        const project = await this.projectService.getProjectWithScope(user, projectId, scopes);
        if (project) {
            return project;
        }
        if (!(await this.projectService.findProject(projectId))) {
            throw new errors_1.NotFoundError(`Project not found: ${projectId}`);
        }
        throw new errors_1.ForbiddenError('You do not have permission to import into this project.');
    }
    async assertFolderExistsInProject(folderId, projectId) {
        if (folderId === undefined) {
            return;
        }
        try {
            await this.folderService.findFolderInProjectOrFail(folderId, projectId);
        }
        catch (cause) {
            throw new n8n_workflow_1.UserError(`Folder not found in target project: ${folderId}`, { cause });
        }
    }
};
exports.WorkflowPackageImporter = WorkflowPackageImporter;
exports.WorkflowPackageImporter = WorkflowPackageImporter = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [n8n_package_parser_1.N8nPackageParser, import_orchestrator_1.ImportOrchestrator, workflow_publisher_1.WorkflowPublisher, project_service_ee_1.ProjectService, folder_service_1.FolderService, backend_common_1.LicenseState])
], WorkflowPackageImporter);
//# sourceMappingURL=workflow-package-importer.js.map