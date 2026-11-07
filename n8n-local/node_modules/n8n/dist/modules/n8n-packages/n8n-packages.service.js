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
exports.N8nPackagesService = void 0;
const backend_services_1 = require("@n8n/backend-services");
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const constants_1 = require("../../constants");
const errors_1 = require("@n8n/errors");
const import_result_1 = require("./engine/import-result");
const import_telemetry_1 = require("./engine/import-telemetry");
const n8n_package_parser_1 = require("./engine/n8n-package-parser");
const project_package_importer_1 = require("./engine/project-package-importer");
const workflow_package_importer_1 = require("./engine/workflow-package-importer");
const agent_selection_exporter_1 = require("./entities/agent/agent-selection.exporter");
const credential_exporter_1 = require("./entities/credential/credential.exporter");
const data_table_exporter_1 = require("./entities/data-table/data-table.exporter");
const folder_conflict_policy_1 = require("./entities/folder/folder-conflict-policy");
const folder_exporter_1 = require("./entities/folder/folder.exporter");
const project_exporter_1 = require("./entities/project/project.exporter");
const requirements_types_1 = require("./entities/requirements.types");
const tag_exporter_1 = require("./entities/tag/tag.exporter");
const variable_exporter_1 = require("./entities/variable/variable.exporter");
const node_type_usage_1 = require("./entities/workflow/node-type-usage");
const static_sub_workflow_requirements_1 = require("./entities/workflow/static-sub-workflow-requirements");
const auto_included_workflow_resolver_1 = require("./entities/workflow/auto-included-workflow-resolver");
const auto_included_workflow_exporter_1 = require("./entities/workflow/auto-included-workflow.exporter");
const workflow_dependency_resolver_1 = require("./entities/workflow/workflow-dependency-resolver");
const workflow_requirement_exporter_1 = require("./entities/workflow/workflow-requirement.exporter");
const workflow_exporter_1 = require("./entities/workflow/workflow.exporter");
const directory_package_reader_1 = require("./io/directory/directory-package-reader");
const directory_package_writer_1 = require("./io/directory/directory-package-writer");
const entity_file_format_1 = require("./io/entity-file-format");
const tar_package_reader_1 = require("./io/tar/tar-package-reader");
const tar_package_writer_1 = require("./io/tar/tar-package-writer");
const n8n_packages_config_1 = require("./n8n-packages.config");
const n8n_packages_types_1 = require("./n8n-packages.types");
const constants_2 = require("./spec/constants");
const manifest_schema_1 = require("./spec/manifest.schema");
const CHERRY_PICK_IMPORT_POLICY = {
    projectConflictPolicy: 'merge',
    folderConflictPolicy: 'merge',
    workflowPublishingPolicy: 'match-source',
    missingNodeTypeMode: 'fail',
    credentialMatchingMode: 'id-only',
    credentialMissingMode: 'must-preexist',
    credentialConflictPolicy: 'keep-existing',
    dataTableMatchingMode: 'by-id',
    dataTableMissingMode: 'create',
    variableMissingMode: 'must-preexist',
    variableConflictPolicy: 'keep-existing',
    tagMissingMode: 'create',
    tagConflictPolicy: 'skip',
};
let N8nPackagesService = class N8nPackagesService {
    constructor(projectExporter, workflowExporter, folderExporter, credentialExporter, dataTableExporter, variableExporter, tagExporter, globalConfig, instanceSettings, packageParser, packageImportConfig, projectPackageImporter, workflowPackageImporter, eventService, workflowRequirementExporter, workflowDependencyResolver, autoIncludedWorkflowResolver, autoIncludedWorkflowExporter, agentSelectionExporter) {
        this.projectExporter = projectExporter;
        this.workflowExporter = workflowExporter;
        this.folderExporter = folderExporter;
        this.credentialExporter = credentialExporter;
        this.dataTableExporter = dataTableExporter;
        this.variableExporter = variableExporter;
        this.tagExporter = tagExporter;
        this.globalConfig = globalConfig;
        this.instanceSettings = instanceSettings;
        this.packageParser = packageParser;
        this.packageImportConfig = packageImportConfig;
        this.projectPackageImporter = projectPackageImporter;
        this.workflowPackageImporter = workflowPackageImporter;
        this.eventService = eventService;
        this.workflowRequirementExporter = workflowRequirementExporter;
        this.workflowDependencyResolver = workflowDependencyResolver;
        this.autoIncludedWorkflowResolver = autoIncludedWorkflowResolver;
        this.autoIncludedWorkflowExporter = autoIncludedWorkflowExporter;
        this.agentSelectionExporter = agentSelectionExporter;
    }
    async exportPackage(request) {
        const writer = new tar_package_writer_1.TarPackageWriter();
        const result = await this.writeExport(writer, request);
        const stream = writer.finalize();
        this.eventService.emit('n8n-package-exported', {
            user: request.user,
            ...(result.agentIds.length ? { agentIds: result.agentIds } : {}),
            ...(result.workflowIds.length ? { workflowIds: result.workflowIds } : {}),
            ...(result.folderIds.length ? { folderIds: result.folderIds } : {}),
            ...(result.projectIds.length ? { projectIds: result.projectIds } : {}),
            counts: result.counts,
            credentialExportPolicy: result.credentialExportPolicy,
            includeArchivedWorkflows: result.includeArchivedWorkflows,
        });
        return { stream, counts: result.counts };
    }
    async exportPackageToDirectory(request, target) {
        const writer = new directory_package_writer_1.DirectoryPackageWriter(target.targetDir);
        const result = await this.exportPackageToWriter(request, writer);
        await writer.finalize();
        return { counts: result.counts, manifest: result.manifest };
    }
    async exportPackageToWriter(request, writer) {
        const { manifest, counts } = await this.writeExport(writer, request);
        return { manifest, counts };
    }
    async writeExport(writer, request) {
        const dependencyPolicy = request.dependencyPolicy ?? n8n_packages_types_1.ExportDependencyPolicy.Fail;
        const isReferenceOnly = dependencyPolicy === n8n_packages_types_1.ExportDependencyPolicy.ReferenceOnly;
        const includeTags = (request.includeTags ?? true) && !this.globalConfig.tags.disabled;
        const versionPolicy = request.versionPolicy ?? n8n_packages_types_1.ExportVersionPolicy.Latest;
        const credentialExportPolicy = request.credentialExportPolicy ?? n8n_packages_types_1.CredentialExportPolicy.ExpressionValuesOnly;
        const includeArchivedWorkflows = request.includeArchivedWorkflows ?? false;
        const { folderExportResult, workflowExportResult, projectExportResult, agentExportResult } = await this.exportSelectedEntities(writer, request, {
            includeTags,
            versionPolicy,
            dependencyPolicy,
            includeArchivedWorkflows,
        });
        const allFoldersBeforeAutoInclude = [
            ...(folderExportResult?.entries ?? []),
            ...(projectExportResult?.folderEntries ?? []),
        ];
        const allProjectsBeforeAutoInclude = [
            ...(projectExportResult?.entries ?? []),
            ...(agentExportResult?.projectEntries ?? []),
        ];
        const projectTargetsBeforeAutoInclude = agentExportResult?.projectTargetsById ?? projectExportResult?.projectTargetsById;
        const allWorkflowsBeforeAutoInclude = [
            ...(workflowExportResult?.entries ?? []),
            ...(folderExportResult?.workflowEntries ?? []),
            ...(projectExportResult?.workflowEntries ?? []),
        ];
        const agentWorkflowRequirements = agentExportResult?.workflowRequirements ?? [];
        const exportedWorkflowIds = allWorkflowsBeforeAutoInclude.map(({ id }) => id);
        const workflowIdsToResolve = [...exportedWorkflowIds];
        if (!isReferenceOnly) {
            workflowIdsToResolve.push(...agentWorkflowRequirements.map(({ referencedWorkflowId }) => referencedWorkflowId));
        }
        const workflowRequirements = await this.workflowDependencyResolver.resolve({
            user: request.user,
            workflowIds: workflowIdsToResolve,
            traversal: isReferenceOnly ? 'direct' : 'transitive',
            versionPolicy,
        });
        const allWorkflowRequirements = [...agentWorkflowRequirements, ...workflowRequirements];
        let autoIncludedExportResult;
        if (dependencyPolicy === n8n_packages_types_1.ExportDependencyPolicy.IncludeInPackage) {
            const autoIncludedWorkflowResolution = await this.autoIncludedWorkflowResolver.resolve({
                user: request.user,
                requirements: workflowRequirements,
                exportedWorkflowIds,
                workflowSeeds: [
                    ...(workflowExportResult?.entries ?? []).map(({ id }) => ({
                        workflowId: id,
                        origin: 'top-level',
                    })),
                    ...(folderExportResult?.workflowEntries ?? []).map(({ id }) => ({
                        workflowId: id,
                        origin: 'folder',
                    })),
                    ...(projectExportResult?.workflowEntries ?? []).map(({ id }) => ({
                        workflowId: id,
                        origin: 'project',
                    })),
                    ...agentWorkflowRequirements.map(({ referencedWorkflowId, origin }) => ({
                        workflowId: referencedWorkflowId,
                        origin,
                    })),
                ],
                includeTags,
                versionPolicy,
            });
            autoIncludedExportResult = await this.autoIncludedWorkflowExporter.export({
                writer,
                workflows: autoIncludedWorkflowResolution.autoIncludedWorkflows,
                existingWorkflowEntries: allWorkflowsBeforeAutoInclude,
                existingFolderEntries: allFoldersBeforeAutoInclude,
                existingProjectEntries: allProjectsBeforeAutoInclude,
                includeTags,
                projectTargetsById: projectTargetsBeforeAutoInclude,
            });
        }
        const requirements = (0, requirements_types_1.mergeRequirements)(workflowExportResult?.requirements, folderExportResult?.requirements, projectExportResult?.requirements, agentExportResult?.requirements, autoIncludedExportResult?.requirements);
        const includeVariableValues = request.includeVariableValues ?? true;
        if (includeVariableValues &&
            requirements.variables.length > 0 &&
            request.canExportVariableValues === false) {
            throw new errors_1.ForbiddenError('The exported entities reference variables, but the API key is missing the variable:list scope needed to bundle their values. Add the scope or set includeVariableValues to false.');
        }
        const allFolders = this.dedupeManifestEntries([
            ...allFoldersBeforeAutoInclude,
            ...(autoIncludedExportResult?.folderEntries ?? []),
        ]);
        const allProjects = this.dedupeManifestEntries([
            ...allProjectsBeforeAutoInclude,
            ...(autoIncludedExportResult?.projectEntries ?? []),
        ]);
        const allWorkflowsInPackage = this.dedupeManifestEntries([
            ...allWorkflowsBeforeAutoInclude,
            ...(autoIncludedExportResult?.workflowEntries ?? []),
        ]);
        if (!isReferenceOnly) {
            (0, static_sub_workflow_requirements_1.assertStaticSubWorkflowsIncluded)(allWorkflowRequirements, new Set(allWorkflowsInPackage.map(({ id }) => id)));
        }
        const projectTargetsById = autoIncludedExportResult?.projectTargetsById ?? projectTargetsBeforeAutoInclude;
        const credentialExportResult = await this.credentialExporter.export({
            user: request.user,
            requirements: requirements.credentials,
            writer,
            credentialExportPolicy,
            projectTargetsById,
        });
        const dataTableExportResult = await this.dataTableExporter.export({
            user: request.user,
            requirements: requirements.dataTables,
            writer,
            projectTargetsById,
        });
        const workflowRequirementExportResult = await this.workflowRequirementExporter.export({
            user: request.user,
            requirements: allWorkflowRequirements,
            workflows: allWorkflowsInPackage,
        });
        const variableExportResult = await this.variableExporter.export({
            user: request.user,
            requirements: requirements.variables,
            writer,
            includeVariableValues,
            projectTargetsById,
        });
        const tagExportResult = await this.tagExporter.export({
            usages: requirements.tags,
            writer,
        });
        const manifestRequirements = this.buildManifestRequirements({
            agents: agentExportResult?.agentRequirements,
            credentials: credentialExportResult.requirements,
            dataTables: dataTableExportResult.requirements,
            workflows: workflowRequirementExportResult.requirements,
            variables: variableExportResult.requirements,
            tags: tagExportResult.requirements,
            nodeTypes: (0, node_type_usage_1.collectNodeTypeUsage)(requirements.nodeTypes),
        });
        const agentEntries = agentExportResult?.agentEntries ?? [];
        const manifest = manifest_schema_1.packageManifestSchema.parse({
            packageFormatVersion: constants_2.FORMAT_VERSION,
            exportedAt: new Date().toISOString(),
            sourceN8nVersion: constants_1.N8N_VERSION,
            sourceId: this.instanceSettings.instanceId,
            ...(agentEntries.length > 0 ? { agents: agentEntries } : {}),
            ...(credentialExportResult.entries.length > 0
                ? { credentials: credentialExportResult.entries }
                : {}),
            ...(dataTableExportResult.entries.length > 0
                ? { dataTables: dataTableExportResult.entries }
                : {}),
            ...(variableExportResult.entries.length > 0
                ? { variables: variableExportResult.entries }
                : {}),
            ...(tagExportResult.entries.length > 0 ? { tags: tagExportResult.entries } : {}),
            ...(manifestRequirements ? { requirements: manifestRequirements } : {}),
            ...(allWorkflowsInPackage.length > 0 ? { workflows: allWorkflowsInPackage } : {}),
            ...(allFolders.length > 0 ? { folders: allFolders } : {}),
            ...(allProjects.length > 0 ? { projects: allProjects } : {}),
        });
        await writer.writeFile('manifest.json', (0, entity_file_format_1.formatEntityFile)(manifest));
        const counts = {
            agents: agentEntries.length,
            workflows: allWorkflowsInPackage.length,
            folders: allFolders.length,
            credentials: credentialExportResult.entries.length,
            dataTables: dataTableExportResult.entries.length,
            variables: variableExportResult.entries.length,
            tags: tagExportResult.entries.length,
        };
        return {
            manifest,
            counts,
            agentIds: agentEntries.map(({ id }) => id),
            workflowIds: allWorkflowsInPackage.map(({ id }) => id),
            folderIds: allFolders.map(({ id }) => id),
            projectIds: allProjects.map(({ id }) => id),
            credentialExportPolicy,
            includeArchivedWorkflows,
        };
    }
    async exportSelectedEntities(writer, request, options) {
        const workflowIds = request.workflowIds ?? [];
        const folderIds = request.folderIds ?? [];
        const projectIds = request.projectIds ?? [];
        const { includeTags, versionPolicy, dependencyPolicy, includeArchivedWorkflows } = options;
        const folderExportResult = folderIds.length > 0
            ? await this.folderExporter.export({
                user: request.user,
                folderIds,
                writer,
                includeTags,
                versionPolicy,
                includeArchivedWorkflows,
            })
            : undefined;
        const workflowsForExport = this.filterWorkflowsAlreadyInFolders(folderExportResult?.workflowEntries, workflowIds);
        const workflowExportResult = workflowsForExport.length > 0
            ? await this.workflowExporter.export({
                user: request.user,
                workflowIds: workflowsForExport,
                writer,
                includeTags,
                versionPolicy,
            })
            : undefined;
        const projectExportResult = projectIds.length > 0
            ? await this.projectExporter.export({
                user: request.user,
                projectIds,
                workflowIds: request.projectWorkflowIds,
                writer,
                includeTags,
                versionPolicy,
                includeArchivedWorkflows,
            })
            : undefined;
        const agentExportResult = request.includeAgents === false
            ? undefined
            : await this.agentSelectionExporter.export({
                user: request.user,
                writer,
                agentIds: request.agentIds,
                projectIds,
                projectWorkflowIds: request.projectWorkflowIds,
                versionPolicy,
                dependencyPolicy,
                projectTargetsById: projectExportResult?.projectTargetsById,
            });
        return { folderExportResult, workflowExportResult, projectExportResult, agentExportResult };
    }
    async importPackage(request) {
        const reader = new tar_package_reader_1.TarPackageReader(request.packageBuffer, this.packageImportConfig);
        const manifest = await this.readImportManifest(reader);
        const { result, scopes } = await this.dispatchImport(request, reader, manifest, 'package-import');
        const resolvedRequest = {
            ...request,
            folderConflictPolicy: (0, folder_conflict_policy_1.resolveFolderConflictPolicy)(request, isProjectPackage(manifest) ? 'project' : 'workflow'),
        };
        (0, import_telemetry_1.emitPackageImportedEvent)(this.eventService, { request: resolvedRequest, manifest, scopes });
        return result;
    }
    async importPackageFromDirectory(request, source) {
        const opened = await this.readDirectoryProjectPackage(source);
        if (opened.status === 'empty')
            return opened.result;
        const { result } = await this.dispatchImport(request, opened.reader, opened.manifest, 'git-pull');
        return result;
    }
    async importPackageSelectionFromDirectory(request, source, selection) {
        const opened = await this.readDirectoryProjectPackage(source);
        if (opened.status === 'empty')
            return opened.result;
        const { result } = await this.dispatchSelectionImport(request, opened.reader, opened.manifest, selection, 'git-pull');
        return result;
    }
    async importPackageSelection(request, selection) {
        const reader = new tar_package_reader_1.TarPackageReader(request.packageBuffer, this.packageImportConfig);
        const manifest = await this.readImportManifest(reader);
        if (!isProjectPackage(manifest)) {
            throw new errors_1.BadRequestError('A selection import requires a project package.');
        }
        const { result, scopes, resolvedRequest } = await this.dispatchSelectionImport(request, reader, manifest, selection, 'package-import');
        (0, import_telemetry_1.emitPackageImportedEvent)(this.eventService, {
            request: { ...resolvedRequest, packageBuffer: request.packageBuffer },
            manifest,
            scopes,
        });
        return result;
    }
    async readImportManifest(reader) {
        const manifest = await this.packageParser.getManifest(reader);
        if (manifest.agents?.length) {
            throw new errors_1.BadRequestError('Importing packages that contain Agents is not supported yet.');
        }
        return manifest;
    }
    async readDirectoryProjectPackage(source) {
        const reader = new directory_package_reader_1.DirectoryPackageReader(source.sourceDir, this.packageImportConfig);
        await reader.listEntries();
        const manifest = await this.readImportManifest(reader);
        if (isProjectPackage(manifest)) {
            return { status: 'project', reader, manifest };
        }
        if (hasContentWithoutProjects(manifest)) {
            throw new errors_1.BadRequestError('Directory packages must contain projects');
        }
        return { status: 'empty', result: emptyImportResult(manifest) };
    }
    async dispatchSelectionImport(request, reader, manifest, selection, importSource) {
        const packageProjectIds = new Set((manifest.projects ?? []).map((project) => project.id));
        if (!packageProjectIds.has(selection.selectedProjectId)) {
            throw new errors_1.BadRequestError(`The selected project "${selection.selectedProjectId}" is not present in the package.`);
        }
        const resolvedRequest = {
            user: request.user,
            ...(request.apiKeyScopes !== undefined ? { apiKeyScopes: request.apiKeyScopes } : {}),
            ...(request.bindings !== undefined ? { bindings: request.bindings } : {}),
            ...CHERRY_PICK_IMPORT_POLICY,
            overwriteDeletionPolicy: request.overwriteDeletionPolicy ?? n8n_packages_types_1.OverwriteDeletionPolicy.Archive,
            workflowConflictPolicy: request.workflowConflictPolicy ?? n8n_packages_types_1.WorkflowConflictPolicy.NewVersion,
            workflowIdPolicy: request.workflowIdPolicy ?? n8n_packages_types_1.WorkflowIdPolicy.Source,
            dataTableSchemaConflictPolicy: request.dataTableSchemaConflictPolicy ?? n8n_packages_types_1.DataTableSchemaConflictPolicy.Fail,
            selection,
        };
        const outcome = await this.projectPackageImporter.import(resolvedRequest, reader, manifest, importSource);
        return { ...outcome, resolvedRequest };
    }
    async dispatchImport(request, reader, manifest, importSource) {
        if (isProjectPackage(manifest)) {
            if (request.variableParentPolicy !== undefined) {
                throw new errors_1.BadRequestError('variableParentPolicy is not supported for project packages, where variable placement follows the package layout. Omit it.');
            }
            const rejection = (0, folder_conflict_policy_1.folderPolicyRejection)(request, 'project');
            if (rejection)
                throw new errors_1.BadRequestError(rejection);
            return await this.projectPackageImporter.import({ ...request, folderConflictPolicy: (0, folder_conflict_policy_1.resolveFolderConflictPolicy)(request, 'project') }, reader, manifest, importSource);
        }
        const rejection = (0, folder_conflict_policy_1.folderPolicyRejection)(request, 'workflow');
        if (rejection)
            throw new errors_1.BadRequestError(rejection);
        return await this.workflowPackageImporter.import({ ...request, folderConflictPolicy: (0, folder_conflict_policy_1.resolveFolderConflictPolicy)(request, 'workflow') }, reader, manifest);
    }
    filterWorkflowsAlreadyInFolders(workflowsInFolders = [], workflowIds) {
        const folderWorkflowIds = new Set(workflowsInFolders.map((entry) => entry.id) ?? []);
        return workflowIds.filter((id) => !folderWorkflowIds.has(id));
    }
    dedupeManifestEntries(entries) {
        const byId = new Map();
        for (const entry of entries) {
            if (!byId.has(entry.id)) {
                byId.set(entry.id, entry);
            }
        }
        return [...byId.values()];
    }
    buildManifestRequirements(input) {
        const { agents, credentials, dataTables, workflows, variables, tags, nodeTypes } = input;
        const requirements = {
            ...(agents?.length ? { agents } : {}),
            ...(credentials?.length ? { credentials } : {}),
            ...(dataTables?.length ? { dataTables } : {}),
            ...(workflows?.length ? { workflows } : {}),
            ...(variables?.length ? { variables } : {}),
            ...(tags?.length ? { tags } : {}),
            ...(nodeTypes?.length ? { nodeTypes } : {}),
        };
        return Object.keys(requirements).length > 0 ? requirements : undefined;
    }
};
exports.N8nPackagesService = N8nPackagesService;
exports.N8nPackagesService = N8nPackagesService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [project_exporter_1.ProjectExporter, workflow_exporter_1.WorkflowExporter, folder_exporter_1.FolderExporter, credential_exporter_1.CredentialExporter, data_table_exporter_1.DataTableExporter, variable_exporter_1.VariableExporter, tag_exporter_1.TagExporter, config_1.GlobalConfig, n8n_core_1.InstanceSettings, n8n_package_parser_1.N8nPackageParser, n8n_packages_config_1.PackageImportConfig, project_package_importer_1.ProjectPackageImporter, workflow_package_importer_1.WorkflowPackageImporter, backend_services_1.EventService, workflow_requirement_exporter_1.WorkflowRequirementExporter, workflow_dependency_resolver_1.WorkflowDependencyResolver, auto_included_workflow_resolver_1.AutoIncludedWorkflowResolver, auto_included_workflow_exporter_1.AutoIncludedWorkflowExporter, agent_selection_exporter_1.AgentSelectionExporter])
], N8nPackagesService);
function isProjectPackage(manifest) {
    return (manifest.projects?.length ?? 0) > 0;
}
function hasContentWithoutProjects(manifest) {
    return ([
        manifest.workflows,
        manifest.folders,
        manifest.credentials,
        manifest.dataTables,
        manifest.variables,
        manifest.tags,
    ].some((entries) => (entries?.length ?? 0) > 0) || manifest.requirements !== undefined);
}
function emptyImportResult(manifest) {
    return (0, import_result_1.buildImportResult)({
        package: (0, import_result_1.toPackageSummary)(manifest),
        workflows: [],
        removedWorkflows: [],
        removedFolders: [],
        folders: [],
        projects: [],
        bindings: (0, n8n_packages_types_1.createBindings)(),
        credentials: { matched: [], stubbed: [], seeded: [], incomplete: [] },
        dataTables: { matched: 0, created: 0, updated: 0 },
        variables: { matched: [], created: [], stubbed: [], updated: [], missing: [] },
        tags: { matched: [], created: [], renamed: [], reconciled: [], skipped: [] },
    });
}
//# sourceMappingURL=n8n-packages.service.js.map