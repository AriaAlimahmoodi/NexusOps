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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SourceControlExportService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const chunk_1 = __importDefault(require("lodash/chunk"));
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const promises_1 = require("node:fs/promises");
const path_1 = __importDefault(require("path"));
const data_table_repository_1 = require("../../modules/data-table/data-table.repository");
const constants_1 = require("./constants");
const source_control_helper_ee_1 = require("./source-control-helper.ee");
const source_control_scoped_service_1 = require("./source-control-scoped.service");
const variables_service_ee_1 = require("../../environments.ee/variables/variables.service.ee");
let SourceControlExportService = class SourceControlExportService {
    constructor(logger, variablesService, tagRepository, projectRepository, sharedCredentialsRepository, sharedWorkflowRepository, workflowRepository, workflowTagMappingRepository, folderRepository, sourceControlScopedService, instanceSettings, dataTableRepository, projectRelationRepository) {
        this.logger = logger;
        this.variablesService = variablesService;
        this.tagRepository = tagRepository;
        this.projectRepository = projectRepository;
        this.sharedCredentialsRepository = sharedCredentialsRepository;
        this.sharedWorkflowRepository = sharedWorkflowRepository;
        this.workflowRepository = workflowRepository;
        this.workflowTagMappingRepository = workflowTagMappingRepository;
        this.folderRepository = folderRepository;
        this.sourceControlScopedService = sourceControlScopedService;
        this.dataTableRepository = dataTableRepository;
        this.projectRelationRepository = projectRelationRepository;
        this.gitFolder = path_1.default.join(instanceSettings.n8nFolder, constants_1.SOURCE_CONTROL_GIT_FOLDER);
        this.workflowExportFolder = path_1.default.join(this.gitFolder, constants_1.SOURCE_CONTROL_WORKFLOW_EXPORT_FOLDER);
        this.projectExportFolder = path_1.default.join(this.gitFolder, constants_1.SOURCE_CONTROL_PROJECT_EXPORT_FOLDER);
        this.credentialExportFolder = path_1.default.join(this.gitFolder, constants_1.SOURCE_CONTROL_CREDENTIAL_EXPORT_FOLDER);
        this.dataTableExportFolder = path_1.default.join(this.gitFolder, constants_1.SOURCE_CONTROL_DATATABLES_EXPORT_FOLDER);
    }
    getWorkflowPath(workflowId) {
        return (0, source_control_helper_ee_1.getWorkflowExportPath)(workflowId, this.workflowExportFolder);
    }
    getCredentialsPath(credentialsId) {
        return (0, source_control_helper_ee_1.getCredentialExportPath)(credentialsId, this.credentialExportFolder);
    }
    getDataTablePath(dataTableId) {
        return (0, source_control_helper_ee_1.getDataTableExportPath)(dataTableId, this.dataTableExportFolder);
    }
    async deleteRepositoryFolder() {
        try {
            await (0, promises_1.rm)(this.gitFolder, { recursive: true });
        }
        catch (error) {
            this.logger.error(`Failed to delete work folder: ${error.message}`);
        }
    }
    async rmFilesFromExportFolder(filesToBeDeleted) {
        try {
            await Promise.all([...filesToBeDeleted].map(async (e) => await (0, promises_1.rm)(e)));
        }
        catch (error) {
            this.logger.error(`Failed to delete workflows from work folder: ${error.message}`);
        }
        return filesToBeDeleted;
    }
    async getPersonalOwnerEmails(projects) {
        const personalProjectIds = [...projects]
            .filter((project) => project.type === 'personal')
            .map((project) => project.id);
        return await this.projectRelationRepository.findPersonalOwnerEmails(personalProjectIds);
    }
    getResourceOwner(project, ownerEmails) {
        if (project.type === 'team') {
            return { type: 'team', teamId: project.id, teamName: project.name };
        }
        const personalEmail = ownerEmails.get(project.id);
        if (personalEmail === undefined)
            return null;
        return { type: 'personal', projectId: project.id, projectName: project.name, personalEmail };
    }
    async writeExportableWorkflowsToExportFolder(workflowsToBeExported, owners) {
        await Promise.all(workflowsToBeExported.map(async (workflow) => {
            const fileName = this.getWorkflowPath(workflow.id);
            const sanitizedWorkflow = {
                id: workflow.id,
                name: workflow.name,
                description: workflow.description ?? null,
                nodes: workflow.nodes,
                connections: workflow.connections,
                settings: workflow.settings,
                triggerCount: workflow.triggerCount,
                versionId: workflow.versionId,
                owner: owners[workflow.id],
                parentFolderId: workflow.parentFolder?.id ?? null,
                isArchived: workflow.isArchived,
                nodeGroups: workflow.nodeGroups ?? [],
            };
            this.logger.debug(`Writing workflow ${workflow.id} to ${fileName}`);
            return await (0, promises_1.writeFile)(fileName, JSON.stringify(sanitizedWorkflow, null, 2));
        }));
    }
    async exportWorkflowsToWorkFolder(candidates) {
        try {
            (0, source_control_helper_ee_1.sourceControlFoldersExistCheck)([this.workflowExportFolder]);
            const workflowIds = candidates.map((e) => e.id);
            const ownerProjects = await this.sharedWorkflowRepository.findOwnerProjectsByWorkflowIds(workflowIds);
            const ownerEmails = await this.getPersonalOwnerEmails(ownerProjects.values());
            const owners = {};
            for (const [workflowId, project] of ownerProjects) {
                const owner = this.getResourceOwner(project, ownerEmails);
                if (!owner) {
                    throw new n8n_workflow_1.UnexpectedError(`Workflow ${workflowId} has no owner`);
                }
                owners[workflowId] = owner;
            }
            const files = [];
            for (const workflowIdChunk of (0, chunk_1.default)(workflowIds, constants_1.SOURCE_CONTROL_WRITE_FILE_BATCH_SIZE)) {
                const workflows = await this.workflowRepository.find({
                    where: { id: (0, typeorm_1.In)(workflowIdChunk) },
                    relations: ['parentFolder'],
                });
                await this.writeExportableWorkflowsToExportFolder(workflows, owners);
                files.push(...workflows.map((workflow) => ({
                    id: workflow.id,
                    name: this.getWorkflowPath(workflow.name),
                })));
            }
            return {
                count: ownerProjects.size,
                folder: this.workflowExportFolder,
                files,
            };
        }
        catch (error) {
            if (error instanceof n8n_workflow_1.UnexpectedError)
                throw error;
            throw new n8n_workflow_1.UnexpectedError('Failed to export workflows to work folder', { cause: error });
        }
    }
    async exportGlobalVariablesToWorkFolder() {
        try {
            (0, source_control_helper_ee_1.sourceControlFoldersExistCheck)([this.gitFolder]);
            const variables = await this.variablesService.getAllCached({ globalOnly: true });
            if (variables.length === 0) {
                return {
                    count: 0,
                    folder: this.gitFolder,
                    files: [],
                };
            }
            const fileName = (0, source_control_helper_ee_1.getVariablesPath)(this.gitFolder);
            const sanitizedVariables = variables.map((e) => ({
                id: e.id,
                key: e.key,
                type: e.type,
                value: '',
            }));
            await (0, promises_1.writeFile)(fileName, JSON.stringify(sanitizedVariables, null, 2));
            return {
                count: sanitizedVariables.length,
                folder: this.gitFolder,
                files: [
                    {
                        id: '',
                        name: fileName,
                    },
                ],
            };
        }
        catch (error) {
            this.logger.error('Failed to export variables to work folder', { error });
            throw new n8n_workflow_1.UnexpectedError('Failed to export variables to work folder', {
                cause: error,
            });
        }
    }
    async exportDataTablesToWorkFolder(candidates, context) {
        try {
            (0, source_control_helper_ee_1.sourceControlFoldersExistCheck)([this.gitFolder, this.dataTableExportFolder]);
            if (candidates.length === 0) {
                return {
                    count: 0,
                    folder: this.dataTableExportFolder,
                    files: [],
                };
            }
            const candidateIds = candidates.map((candidate) => candidate.id);
            const dataTables = await this.dataTableRepository.find({
                where: {
                    id: (0, typeorm_1.In)(candidateIds),
                    ...this.sourceControlScopedService.getDataTablesInAdminProjectsFromContextFilter(context),
                },
                relations: ['columns', 'project'],
                select: {
                    id: true,
                    name: true,
                    projectId: true,
                    createdAt: true,
                    updatedAt: true,
                    columns: {
                        id: true,
                        name: true,
                        type: true,
                        index: true,
                    },
                    project: {
                        id: true,
                        name: true,
                        type: true,
                    },
                },
            });
            const ownerEmails = await this.getPersonalOwnerEmails(dataTables.flatMap((table) => table.project ?? []));
            const exportedFiles = [];
            for (const table of dataTables) {
                const owner = table.project
                    ? this.getResourceOwner(table.project, ownerEmails)
                    : null;
                const exportableDataTable = {
                    id: table.id,
                    name: table.name,
                    columns: table.columns
                        .sort((a, b) => a.index - b.index)
                        .map((col) => ({
                        id: col.id,
                        name: col.name,
                        type: col.type,
                        index: col.index,
                    })),
                    ownedBy: owner,
                    createdAt: table.createdAt.toISOString(),
                    updatedAt: table.updatedAt.toISOString(),
                };
                const filePath = this.getDataTablePath(table.id);
                await (0, promises_1.writeFile)(filePath, JSON.stringify(exportableDataTable, null, 2));
                exportedFiles.push({
                    id: table.id,
                    name: filePath,
                });
            }
            return {
                count: dataTables.length,
                folder: this.dataTableExportFolder,
                files: exportedFiles,
            };
        }
        catch (error) {
            this.logger.error('Failed to export data tables to work folder', { error });
            throw new n8n_workflow_1.UnexpectedError('Failed to export data tables to work folder', {
                cause: error,
            });
        }
    }
    async exportFoldersToWorkFolder(context) {
        try {
            (0, source_control_helper_ee_1.sourceControlFoldersExistCheck)([this.gitFolder]);
            const folders = await this.folderRepository.find({
                relations: ['parentFolder', 'homeProject'],
                select: {
                    id: true,
                    name: true,
                    createdAt: true,
                    updatedAt: true,
                    parentFolder: {
                        id: true,
                    },
                    homeProject: {
                        id: true,
                    },
                },
                where: this.sourceControlScopedService.getFoldersInAdminProjectsFromContextFilter(context),
            });
            if (folders.length === 0) {
                return {
                    count: 0,
                    folder: this.gitFolder,
                    files: [],
                };
            }
            const fileName = (0, source_control_helper_ee_1.getFoldersPath)(this.gitFolder);
            let foldersToKeepUnchanged = [];
            if (!context.hasAccessToAllProjects()) {
                const existingFolders = await (0, source_control_helper_ee_1.readFoldersFromSourceControlFile)(fileName);
                foldersToKeepUnchanged = existingFolders.folders.filter((folder) => !context.canAccessProject(folder.homeProjectId));
            }
            const newFolders = foldersToKeepUnchanged.concat(...folders.map((f) => ({
                id: f.id,
                name: f.name,
                parentFolderId: f.parentFolder?.id ?? null,
                homeProjectId: f.homeProject.id,
                createdAt: f.createdAt.toISOString(),
                updatedAt: f.updatedAt.toISOString(),
            })));
            await (0, promises_1.writeFile)(fileName, JSON.stringify({
                folders: newFolders,
            }, null, 2));
            return {
                count: folders.length,
                folder: this.gitFolder,
                files: [
                    {
                        id: '',
                        name: fileName,
                    },
                ],
            };
        }
        catch (error) {
            this.logger.error('Failed to export folders to work folder', { error });
            throw new n8n_workflow_1.UnexpectedError('Failed to export folders to work folder', { cause: error });
        }
    }
    async exportTagsToWorkFolder(context) {
        try {
            const fileName = path_1.default.join(this.gitFolder, constants_1.SOURCE_CONTROL_TAGS_EXPORT_FILE);
            (0, source_control_helper_ee_1.sourceControlFoldersExistCheck)([this.gitFolder]);
            const tags = await this.tagRepository.find();
            if (tags.length === 0) {
                await (0, promises_1.writeFile)(fileName, JSON.stringify({ tags: [], mappings: [] }, null, 2));
                return {
                    count: 0,
                    folder: this.gitFolder,
                    files: [{ id: '', name: fileName }],
                };
            }
            const mappingsOfAllowedWorkflows = await this.workflowTagMappingRepository.find({
                where: this.sourceControlScopedService.getWorkflowTagMappingInAdminProjectsFromContextFilter(context),
            });
            const allowedWorkflows = await this.workflowRepository.find({
                select: { id: true },
                where: this.sourceControlScopedService.getWorkflowsInAdminProjectsFromContextFilter(context),
            });
            const allowedWorkflowIds = new Set(allowedWorkflows.map((workflow) => workflow.id));
            const existingTagsAndMapping = await (0, source_control_helper_ee_1.readTagAndMappingsFromSourceControlFile)(fileName);
            const mappingsToKeep = existingTagsAndMapping.mappings.filter((mapping) => !allowedWorkflowIds.has(mapping.workflowId));
            await (0, promises_1.writeFile)(fileName, JSON.stringify({
                tags: tags.map((tag) => ({ id: tag.id, name: tag.name })),
                mappings: mappingsToKeep.concat(mappingsOfAllowedWorkflows),
            }, null, 2));
            return {
                count: tags.length,
                folder: this.gitFolder,
                files: [{ id: '', name: fileName }],
            };
        }
        catch (error) {
            this.logger.error('Failed to export tags to work folder', { error });
            throw new n8n_workflow_1.UnexpectedError('Failed to export tags to work folder', { cause: error });
        }
    }
    async writeExportableCredentialsToExportFolder(sharings, ownerProjects, ownerEmails) {
        await Promise.all(sharings.map(async (sharing) => {
            const { name, type, data, id, isGlobal = false, isResolvable = false, resolvableAllowFallback = false, } = sharing.credentials;
            const credentials = new n8n_core_1.Credentials({ id, name }, type, data);
            const project = ownerProjects.get(sharing.credentialsId);
            const owner = project ? this.getResourceOwner(project, ownerEmails) : null;
            const sanitizedData = (0, source_control_helper_ee_1.sanitizeCredentialData)(await credentials.getData());
            const stub = {
                id,
                name,
                type,
                data: sanitizedData,
                ownedBy: owner,
                isGlobal,
                isResolvable,
                resolvableAllowFallback,
            };
            const filePath = this.getCredentialsPath(id);
            this.logger.debug(`Writing credentials stub "${name}" (ID ${id}) to: ${filePath}`);
            return await (0, promises_1.writeFile)(filePath, JSON.stringify(stub, null, 2));
        }));
    }
    async exportCredentialsToWorkFolder(candidates) {
        try {
            (0, source_control_helper_ee_1.sourceControlFoldersExistCheck)([this.credentialExportFolder]);
            const credentialIds = candidates.map((e) => e.id);
            const ownerProjects = await this.sharedCredentialsRepository.findOwnerProjectsByCredentialIds(credentialIds);
            const ownerEmails = await this.getPersonalOwnerEmails(ownerProjects.values());
            const foundCredentialIds = new Set();
            const files = [];
            for (const credentialIdChunk of (0, chunk_1.default)(credentialIds, constants_1.SOURCE_CONTROL_WRITE_FILE_BATCH_SIZE)) {
                const credentialsToBeExported = await this.sharedCredentialsRepository.findByCredentialIds(credentialIdChunk, 'credential:owner');
                await this.writeExportableCredentialsToExportFolder(credentialsToBeExported, ownerProjects, ownerEmails);
                for (const sharing of credentialsToBeExported) {
                    foundCredentialIds.add(sharing.credentialsId);
                    files.push({
                        id: sharing.credentials.id,
                        name: path_1.default.join(this.credentialExportFolder, `${sharing.credentials.name}.json`),
                    });
                }
            }
            let missingIds = [];
            if (foundCredentialIds.size !== credentialIds.length) {
                missingIds = credentialIds.filter((remote) => !foundCredentialIds.has(remote));
            }
            return {
                count: files.length,
                folder: this.credentialExportFolder,
                files,
                missingIds,
            };
        }
        catch (error) {
            this.logger.error('Failed to export credentials to work folder', { error });
            throw new n8n_workflow_1.UnexpectedError('Failed to export credentials to work folder', { cause: error });
        }
    }
    async exportTeamProjectsToWorkFolder(candidates) {
        try {
            (0, source_control_helper_ee_1.sourceControlFoldersExistCheck)([this.projectExportFolder], true);
            const projectIds = candidates.map((e) => e.id);
            const projects = await this.projectRepository.find({
                where: { id: (0, typeorm_1.In)(projectIds), type: 'team' },
                relations: ['variables'],
            });
            await Promise.all(projects.map(async (project) => {
                const fileName = (0, source_control_helper_ee_1.getProjectExportPath)(project.id, this.projectExportFolder);
                const sanitizedProject = {
                    id: project.id,
                    name: project.name,
                    icon: project.icon,
                    description: project.description,
                    type: 'team',
                    owner: {
                        type: 'team',
                        teamId: project.id,
                        teamName: project.name,
                    },
                    variableStubs: project.variables.map((variable) => ({
                        id: variable.id,
                        key: variable.key,
                        type: variable.type,
                        value: '',
                    })),
                };
                this.logger.debug(`Writing project ${project.id} to ${fileName}`);
                return await (0, promises_1.writeFile)(fileName, JSON.stringify(sanitizedProject, null, 2));
            }));
            return {
                count: projects.length,
                folder: this.projectExportFolder,
                files: projects.map((project) => ({
                    id: project.id,
                    name: (0, source_control_helper_ee_1.getProjectExportPath)(project.id, this.projectExportFolder),
                })),
            };
        }
        catch (error) {
            if (error instanceof n8n_workflow_1.UnexpectedError)
                throw error;
            throw new n8n_workflow_1.UnexpectedError('Failed to export projects to work folder', { cause: error });
        }
    }
};
exports.SourceControlExportService = SourceControlExportService;
exports.SourceControlExportService = SourceControlExportService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, variables_service_ee_1.VariablesService, db_1.TagRepository, db_1.ProjectRepository, db_1.SharedCredentialsRepository, db_1.SharedWorkflowRepository, db_1.WorkflowRepository, db_1.WorkflowTagMappingRepository, db_1.FolderRepository, source_control_scoped_service_1.SourceControlScopedService, n8n_core_1.InstanceSettings, data_table_repository_1.DataTableRepository, db_1.ProjectRelationRepository])
], SourceControlExportService);
//# sourceMappingURL=source-control-export.service.ee.js.map