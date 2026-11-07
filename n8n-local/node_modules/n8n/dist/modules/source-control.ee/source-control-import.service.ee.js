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
exports.SourceControlImportService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const permissions_1 = require("@n8n/permissions");
const typeorm_1 = require("@n8n/typeorm");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const sleep_1 = require("@n8n/utils/sleep");
const fast_glob_1 = __importDefault(require("fast-glob"));
const isEqual_1 = __importDefault(require("lodash/isEqual"));
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const promises_1 = require("node:fs/promises");
const path_1 = __importDefault(require("path"));
const credentials_service_1 = require("../../credentials/credentials.service");
const execution_persistence_1 = require("../../executions/execution-persistence");
const workflow_publish_blocked_error_1 = require("../../errors/response-errors/workflow-publish-blocked.error");
const data_table_column_entity_1 = require("../../modules/data-table/data-table-column.entity");
const data_table_column_repository_1 = require("../../modules/data-table/data-table-column.repository");
const data_table_ddl_service_1 = require("../../modules/data-table/data-table-ddl.service");
const data_table_size_validator_service_1 = require("../../modules/data-table/data-table-size-validator.service");
const data_table_entity_1 = require("../../modules/data-table/data-table.entity");
const data_table_repository_1 = require("../../modules/data-table/data-table.repository");
const sql_utils_1 = require("../../modules/data-table/utils/sql-utils");
const redaction_enforcement_service_1 = require("../../modules/redaction/redaction-enforcement.service");
const policy_enforcement_service_1 = require("../../policy/policy-enforcement.service");
const policy_violation_error_1 = require("../../policy/policy-violation.error");
const response_helper_1 = require("../../response-helper");
const tag_service_1 = require("../../services/tag.service");
const utils_1 = require("../../utils");
const workflow_helpers_1 = require("../../workflow-helpers");
const deprecated_nodes_validation_service_1 = require("../../workflows/deprecated-nodes-validation.service");
const workflow_finder_service_1 = require("../../workflows/workflow-finder.service");
const workflow_history_service_1 = require("../../workflows/workflow-history/workflow-history.service");
const backend_services_1 = require("@n8n/backend-services");
const workflow_service_1 = require("../../workflows/workflow.service");
const constants_1 = require("./constants");
const source_control_context_factory_1 = require("./source-control-context.factory");
const source_control_resource_helper_1 = require("./source-control-resource-helper");
const source_control_helper_ee_1 = require("./source-control-helper.ee");
const source_control_scoped_service_1 = require("./source-control-scoped.service");
const variables_service_ee_1 = require("../../environments.ee/variables/variables.service.ee");
const toStatusOwner = (project) => {
    if (project?.type) {
        return { type: project.type, projectId: project.id, projectName: project.name };
    }
    return undefined;
};
const workflowImportPolicyContext = (workflow, projectId) => ({
    workflow: { id: workflow.id, name: workflow.name, nodes: workflow.nodes },
    projectId,
    transport: 'source-control',
});
const credentialImportPolicyContext = (credential, projectId) => ({
    credential: { id: credential.id, type: credential.type },
    projectId,
    transport: 'source-control',
});
const UNPUBLISH_SETTLE_TIMEOUT_MS = 30_000;
const UNPUBLISH_SETTLE_POLL_INTERVAL_MS = 250;
let SourceControlImportService = class SourceControlImportService {
    constructor(logger, errorReporter, variablesService, credentialsRepository, projectRepository, projectRelationRepository, tagRepository, sharedWorkflowRepository, sharedCredentialsRepository, userRepository, variablesRepository, workflowRepository, workflowTagMappingRepository, workflowService, credentialsService, tagService, folderRepository, instanceSettings, sourceControlContextFactory, sourceControlScopedService, workflowHistoryService, dataTableRepository, dataTableColumnRepository, dataTableDDLService, redactionEnforcementService, policyEnforcementService, dataTableSizeValidator, workflowPublishedVersionRepository, executionPersistence, workflowPublishGuard, workflowMutationHooks, workflowFinderService, deprecatedNodesValidationService) {
        this.logger = logger;
        this.errorReporter = errorReporter;
        this.variablesService = variablesService;
        this.credentialsRepository = credentialsRepository;
        this.projectRepository = projectRepository;
        this.projectRelationRepository = projectRelationRepository;
        this.tagRepository = tagRepository;
        this.sharedWorkflowRepository = sharedWorkflowRepository;
        this.sharedCredentialsRepository = sharedCredentialsRepository;
        this.userRepository = userRepository;
        this.variablesRepository = variablesRepository;
        this.workflowRepository = workflowRepository;
        this.workflowTagMappingRepository = workflowTagMappingRepository;
        this.workflowService = workflowService;
        this.credentialsService = credentialsService;
        this.tagService = tagService;
        this.folderRepository = folderRepository;
        this.sourceControlContextFactory = sourceControlContextFactory;
        this.sourceControlScopedService = sourceControlScopedService;
        this.workflowHistoryService = workflowHistoryService;
        this.dataTableRepository = dataTableRepository;
        this.dataTableColumnRepository = dataTableColumnRepository;
        this.dataTableDDLService = dataTableDDLService;
        this.redactionEnforcementService = redactionEnforcementService;
        this.policyEnforcementService = policyEnforcementService;
        this.dataTableSizeValidator = dataTableSizeValidator;
        this.workflowPublishedVersionRepository = workflowPublishedVersionRepository;
        this.executionPersistence = executionPersistence;
        this.workflowPublishGuard = workflowPublishGuard;
        this.workflowMutationHooks = workflowMutationHooks;
        this.workflowFinderService = workflowFinderService;
        this.deprecatedNodesValidationService = deprecatedNodesValidationService;
        this.gitFolder = path_1.default.join(instanceSettings.n8nFolder, constants_1.SOURCE_CONTROL_GIT_FOLDER);
        this.workflowExportFolder = path_1.default.join(this.gitFolder, constants_1.SOURCE_CONTROL_WORKFLOW_EXPORT_FOLDER);
        this.credentialExportFolder = path_1.default.join(this.gitFolder, constants_1.SOURCE_CONTROL_CREDENTIAL_EXPORT_FOLDER);
        this.projectExportFolder = path_1.default.join(this.gitFolder, constants_1.SOURCE_CONTROL_PROJECT_EXPORT_FOLDER);
        this.dataTableExportFolder = path_1.default.join(this.gitFolder, constants_1.SOURCE_CONTROL_DATATABLES_EXPORT_FOLDER);
    }
    async getRemoteVersionIdsFromFiles(context) {
        const remoteWorkflowFiles = await (0, fast_glob_1.default)('*.json', {
            cwd: this.workflowExportFolder,
            absolute: true,
            followSymbolicLinks: false,
        });
        const remoteWorkflowFilesParsed = await (0, source_control_helper_ee_1.mapInBatches)(remoteWorkflowFiles, constants_1.SOURCE_CONTROL_READ_FILE_BATCH_SIZE, async (file) => {
            const remote = await this.parseWorkflowFromFile(file);
            if (!remote?.id) {
                return undefined;
            }
            const project = remote.owner
                ? context.findAuthorizedProjectByOwner(remote.owner)
                : undefined;
            if (!context.hasAccessToAllProjects() && !project) {
                return undefined;
            }
            return {
                id: remote.id,
                versionId: remote.versionId ?? '',
                name: remote.name,
                description: remote.description,
                parentFolderId: remote.parentFolderId,
                remoteId: remote.id,
                filename: (0, source_control_helper_ee_1.getWorkflowExportPath)(remote.id, this.workflowExportFolder),
                owner: toStatusOwner(project),
                isRemoteArchived: remote.isArchived,
            };
        });
        return remoteWorkflowFilesParsed.filter((workflow) => workflow !== undefined);
    }
    async getAllLocalVersionIdsFromDb() {
        const localWorkflows = await this.workflowRepository.find({
            relations: ['parentFolder'],
            select: {
                id: true,
                versionId: true,
                name: true,
                description: true,
                updatedAt: true,
                parentFolder: {
                    id: true,
                },
            },
        });
        return localWorkflows.map((local) => {
            let updatedAt;
            if (local.updatedAt instanceof Date) {
                updatedAt = local.updatedAt;
            }
            else {
                this.errorReporter.warn('updatedAt is not a Date', {
                    extra: {
                        type: typeof local.updatedAt,
                        value: local.updatedAt,
                    },
                });
                updatedAt = isNaN(Date.parse(local.updatedAt)) ? new Date() : new Date(local.updatedAt);
            }
            return {
                id: local.id,
                versionId: local.versionId,
                name: local.name,
                description: local.description ?? null,
                localId: local.id,
                parentFolderId: local.parentFolder?.id ?? null,
                filename: (0, source_control_helper_ee_1.getWorkflowExportPath)(local.id, this.workflowExportFolder),
                updatedAt: updatedAt.toISOString(),
            };
        });
    }
    async getLocalVersionIdsFromDb(context) {
        const localWorkflows = await this.workflowRepository.find({
            relations: {
                parentFolder: true,
                shared: {
                    project: true,
                },
            },
            select: {
                id: true,
                versionId: true,
                name: true,
                description: true,
                updatedAt: true,
                parentFolder: {
                    id: true,
                },
                shared: {
                    project: {
                        id: true,
                        name: true,
                        type: true,
                    },
                    role: true,
                },
            },
            where: this.sourceControlScopedService.getWorkflowsInAdminProjectsFromContextFilter(context),
        });
        return localWorkflows.map((local) => {
            let updatedAt;
            if (local.updatedAt instanceof Date) {
                updatedAt = local.updatedAt;
            }
            else {
                this.errorReporter.warn('updatedAt is not a Date', {
                    extra: {
                        type: typeof local.updatedAt,
                        value: local.updatedAt,
                    },
                });
                updatedAt = isNaN(Date.parse(local.updatedAt)) ? new Date() : new Date(local.updatedAt);
            }
            const ownerProject = local.shared?.find((s) => s.role === 'workflow:owner')?.project;
            return {
                id: local.id,
                versionId: local.versionId,
                name: local.name,
                description: local.description ?? null,
                localId: local.id,
                parentFolderId: local.parentFolder?.id ?? null,
                filename: (0, source_control_helper_ee_1.getWorkflowExportPath)(local.id, this.workflowExportFolder),
                updatedAt: updatedAt.toISOString(),
                owner: toStatusOwner(ownerProject),
            };
        });
    }
    async getRemoteCredentialsFromFiles(context) {
        const remoteCredentialFiles = await (0, fast_glob_1.default)('*.json', {
            cwd: this.credentialExportFolder,
            absolute: true,
            followSymbolicLinks: false,
        });
        const remoteCredentialFilesRead = await (0, source_control_helper_ee_1.mapInBatches)(remoteCredentialFiles, constants_1.SOURCE_CONTROL_READ_FILE_BATCH_SIZE, async (file) => {
            this.logger.debug(`Parsing credential file ${file}`);
            const remote = (0, n8n_workflow_1.jsonParse)(await (0, promises_1.readFile)(file, { encoding: 'utf8' }));
            return remote;
        });
        const remoteIds = remoteCredentialFilesRead.flatMap((remote) => remote?.id ? [remote.id] : []);
        const localUsageScope = new Map(remoteIds.length === 0
            ? []
            : (await this.credentialsRepository.find({
                where: { id: (0, typeorm_1.In)(remoteIds) },
                select: ['id', 'usageScope'],
            })).map((local) => [local.id, local.usageScope]));
        const remoteCredentialFilesParsed = remoteCredentialFilesRead
            .filter((remote) => {
            if (!remote?.id) {
                return false;
            }
            if (remote.usageScope === 'instance' || localUsageScope.get(remote.id) === 'instance') {
                return false;
            }
            const owner = remote.ownedBy;
            return (!owner || context.hasAccessToAllProjects() || context.findAuthorizedProjectByOwner(owner));
        })
            .map((remote) => {
            const project = remote.ownedBy
                ? context.findAuthorizedProjectByOwner(remote.ownedBy)
                : null;
            return {
                ...remote,
                ownedBy: project
                    ? {
                        type: project.type,
                        projectId: project.id,
                        projectName: project.name,
                    }
                    : undefined,
                filename: (0, source_control_helper_ee_1.getCredentialExportPath)(remote.id, this.credentialExportFolder),
            };
        });
        return remoteCredentialFilesParsed.filter((e) => e !== undefined);
    }
    async getLocalCredentialsFromDb(context) {
        const localCredentials = await this.credentialsRepository.find({
            relations: {
                shared: {
                    project: true,
                },
            },
            select: {
                id: true,
                name: true,
                type: true,
                data: true,
                isGlobal: true,
                isResolvable: true,
                resolvableAllowFallback: true,
                shared: {
                    project: {
                        id: true,
                        name: true,
                        type: true,
                    },
                    role: true,
                },
            },
            where: this.credentialsRepository.excludePendingAuthorization(this.sourceControlScopedService.getCredentialsInAdminProjectsFromContextFilter(context)),
        });
        return (await (0, source_control_helper_ee_1.mapInBatches)(localCredentials, constants_1.SOURCE_CONTROL_READ_FILE_BATCH_SIZE, async (local) => {
            const ownerProject = local.shared?.find((s) => s.role === 'credential:owner')?.project;
            let data = {};
            try {
                const credentials = new n8n_core_1.Credentials({ id: local.id, name: local.name }, local.type, local.data);
                data = (0, source_control_helper_ee_1.sanitizeCredentialData)(await credentials.getData());
            }
            catch {
            }
            return {
                id: local.id,
                name: local.name,
                type: local.type,
                data,
                filename: (0, source_control_helper_ee_1.getCredentialExportPath)(local.id, this.credentialExportFolder),
                ownedBy: toStatusOwner(ownerProject),
                isGlobal: local.isGlobal,
                isResolvable: local.isResolvable,
                resolvableAllowFallback: local.resolvableAllowFallback,
            };
        }));
    }
    async getRemoteVariablesFromFile() {
        const variablesFile = await (0, fast_glob_1.default)(constants_1.SOURCE_CONTROL_VARIABLES_EXPORT_FILE, {
            cwd: this.gitFolder,
            absolute: true,
            followSymbolicLinks: false,
        });
        if (variablesFile.length > 0) {
            this.logger.debug(`Importing variables from file ${variablesFile[0]}`);
            return (0, n8n_workflow_1.jsonParse)(await (0, promises_1.readFile)(variablesFile[0], { encoding: 'utf8' }), {
                fallbackValue: [],
            });
        }
        return [];
    }
    async getLocalGlobalVariablesFromDb() {
        return await this.variablesService.getAllCached({ globalOnly: true });
    }
    async getRemoteDataTablesFromFiles(context) {
        const dataTableFiles = await (0, fast_glob_1.default)('*.json', {
            cwd: this.dataTableExportFolder,
            absolute: true,
            followSymbolicLinks: false,
        });
        if (dataTableFiles.length === 0) {
            return [];
        }
        const remoteTables = await (0, source_control_helper_ee_1.mapInBatches)(dataTableFiles, constants_1.SOURCE_CONTROL_READ_FILE_BATCH_SIZE, async (file) => {
            this.logger.debug(`Parsing data table file ${file}`);
            const fileContent = await (0, promises_1.readFile)(file, { encoding: 'utf8' });
            try {
                return (0, n8n_workflow_1.jsonParse)(fileContent);
            }
            catch (error) {
                this.logger.warn(`Failed to parse data table from file ${file}: invalid JSON format`);
                return undefined;
            }
        });
        return remoteTables.filter((table) => {
            if (!table) {
                return false;
            }
            if (!table.ownedBy) {
                return true;
            }
            const isOwnedByAuthorizedProject = !!context.findAuthorizedProjectByOwner(table.ownedBy);
            return context.hasAccessToAllProjects() || isOwnedByAuthorizedProject;
        });
    }
    async getLocalDataTablesFromDb(context) {
        try {
            const dataTables = await this.dataTableRepository.find({
                relations: ['columns', 'project'],
                where: this.sourceControlScopedService.getDataTablesInAdminProjectsFromContextFilter(context),
            });
            const ownerEmails = await this.projectRelationRepository.findPersonalOwnerEmails(dataTables.flatMap((table) => (table.project?.type === 'personal' ? table.project.id : [])));
            return dataTables.map((table) => {
                let ownedBy = null;
                if (table.project?.type === 'personal') {
                    if (ownerEmails.has(table.project.id)) {
                        ownedBy = {
                            type: 'personal',
                            projectId: table.project.id,
                            projectName: table.project.name,
                        };
                    }
                }
                else if (table.project?.type === 'team') {
                    ownedBy = {
                        type: 'team',
                        projectId: table.project.id,
                        projectName: table.project.name,
                    };
                }
                return {
                    id: table.id,
                    name: table.name,
                    columns: (table.columns || [])
                        .sort((a, b) => a.index - b.index)
                        .map((col) => ({
                        id: col.id,
                        name: col.name,
                        type: col.type,
                        index: col.index,
                    })),
                    ownedBy,
                    filename: (0, source_control_helper_ee_1.getDataTableExportPath)(table.id, this.dataTableExportFolder),
                    createdAt: table.createdAt.toISOString(),
                    updatedAt: table.updatedAt.toISOString(),
                };
            });
        }
        catch (error) {
            if (error instanceof Error && error.message.includes('No metadata for "DataTable"')) {
                return [];
            }
            throw error;
        }
    }
    async getRemoteFoldersAndMappingsFromFile(context) {
        const foldersFile = await (0, fast_glob_1.default)(constants_1.SOURCE_CONTROL_FOLDERS_EXPORT_FILE, {
            cwd: this.gitFolder,
            absolute: true,
            followSymbolicLinks: false,
        });
        if (foldersFile.length > 0) {
            this.logger.debug(`Importing folders from file ${foldersFile[0]}`);
            const mappedFolders = (0, n8n_workflow_1.jsonParse)(await (0, promises_1.readFile)(foldersFile[0], { encoding: 'utf8' }), {
                fallbackValue: { folders: [] },
            });
            if (!context.hasAccessToAllProjects()) {
                mappedFolders.folders = mappedFolders.folders.filter((folder) => context.canAccessProject(folder.homeProjectId));
            }
            return mappedFolders;
        }
        return { folders: [] };
    }
    async getLocalFoldersAndMappingsFromDb(context) {
        const localFolders = await this.folderRepository.find({
            relations: ['parentFolder', 'homeProject'],
            select: {
                id: true,
                name: true,
                createdAt: true,
                updatedAt: true,
                parentFolder: { id: true },
                homeProject: { id: true },
            },
            where: this.sourceControlScopedService.getFoldersInAdminProjectsFromContextFilter(context),
        });
        return {
            folders: localFolders.map((f) => ({
                id: f.id,
                name: f.name,
                parentFolderId: f.parentFolder?.id ?? null,
                homeProjectId: f.homeProject.id,
                createdAt: f.createdAt.toISOString(),
                updatedAt: f.updatedAt.toISOString(),
            })),
        };
    }
    async getRemoteTagsAndMappingsFromFile(context) {
        const tagsFile = await (0, fast_glob_1.default)(constants_1.SOURCE_CONTROL_TAGS_EXPORT_FILE, {
            cwd: this.gitFolder,
            absolute: true,
            followSymbolicLinks: false,
        });
        if (tagsFile.length > 0) {
            this.logger.debug(`Importing tags from file ${tagsFile[0]}`);
            const mappedTags = (0, n8n_workflow_1.jsonParse)(await (0, promises_1.readFile)(tagsFile[0], { encoding: 'utf8' }), { fallbackValue: { tags: [], mappings: [] } });
            const accessibleWorkflows = await this.sourceControlScopedService.getWorkflowsInAdminProjectsFromContext(context);
            if (accessibleWorkflows) {
                mappedTags.mappings = mappedTags.mappings.filter((mapping) => accessibleWorkflows.some((workflow) => workflow.id === mapping.workflowId));
            }
            return mappedTags;
        }
        return { tags: [], mappings: [] };
    }
    async getLocalTagsAndMappingsFromDb(context) {
        const localTags = await this.tagRepository.find({ select: ['id', 'name'] });
        const localMappings = await this.workflowTagMappingRepository.find({
            select: ['workflowId', 'tagId'],
            where: this.sourceControlScopedService.getWorkflowTagMappingInAdminProjectsFromContextFilter(context),
        });
        return { tags: localTags, mappings: localMappings };
    }
    async getRemoteProjectsFromFiles(context) {
        const remoteProjectFiles = await (0, fast_glob_1.default)('*.json', {
            cwd: this.projectExportFolder,
            absolute: true,
            followSymbolicLinks: false,
        });
        const remoteProjects = await (0, source_control_helper_ee_1.mapInBatches)(remoteProjectFiles, constants_1.SOURCE_CONTROL_READ_FILE_BATCH_SIZE, async (file) => {
            this.logger.debug(`Parsing project file ${file}`);
            const fileContent = await (0, promises_1.readFile)(file, { encoding: 'utf8' });
            const parsedProject = (0, n8n_workflow_1.jsonParse)(fileContent);
            return {
                ...parsedProject,
                filename: (0, source_control_helper_ee_1.getProjectExportPath)(parsedProject.id, this.projectExportFolder),
            };
        });
        if (context.hasAccessToAllProjects()) {
            return remoteProjects;
        }
        return remoteProjects.filter((remoteProject) => {
            return context.findAuthorizedProjectByOwner(remoteProject.owner);
        });
    }
    async getLocalTeamProjectsFromDb(context) {
        let where = { type: 'team' };
        if (context) {
            where = {
                type: 'team',
                ...(this.sourceControlScopedService.getProjectsWithPushScopeByContextFilter(context) ?? {}),
            };
        }
        const localProjects = await this.projectRepository.find({
            select: ['id', 'name', 'description', 'icon', 'type'],
            relations: ['variables'],
            where,
        });
        return localProjects.map((local) => this.mapProjectEntityToExportableProjectWithFileName(local));
    }
    mapProjectEntityToExportableProjectWithFileName(project) {
        return {
            id: project.id,
            name: project.name,
            description: project.description,
            icon: project.icon,
            filename: (0, source_control_helper_ee_1.getProjectExportPath)(project.id, this.projectExportFolder),
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
    }
    async importWorkflowFromWorkFolder(candidates, userId, autoPublish = 'none') {
        const personalProject = await this.projectRepository.getPersonalProjectForUserOrFail(userId);
        const candidateIds = candidates.map((c) => c.id);
        const existingWorkflows = await this.workflowRepository.findByIds(candidateIds, {
            fields: ['id', 'name', 'versionId', 'active', 'activeVersionId', 'isArchived', 'nodes'],
        });
        const folders = await this.folderRepository.find({ select: ['id'] });
        const existingFolderIds = folders.map((f) => f.id);
        const allSharedWorkflows = await this.sharedWorkflowRepository.findWithFields(candidateIds, {
            select: ['workflowId', 'role', 'projectId'],
        });
        const importWorkflowsResult = [];
        for (const candidate of candidates) {
            const result = await this.importSingleWorkflowFromFile(candidate, userId, autoPublish, existingWorkflows, existingFolderIds, allSharedWorkflows, personalProject);
            if (result) {
                importWorkflowsResult.push(result);
            }
        }
        return importWorkflowsResult;
    }
    async importSingleWorkflowFromFile(candidate, userId, autoPublish, existingWorkflows, existingFolderIds, allSharedWorkflows, personalProject) {
        this.logger.debug(`Importing workflow file ${candidate.file}`);
        const importedWorkflow = await this.parseWorkflowFromFile(candidate.file);
        importedWorkflow.nodeGroups ??= [];
        try {
            (0, workflow_helpers_1.validateWorkflowNodeGroups)(importedWorkflow, null);
        }
        catch {
            this.logger.warn(`Workflow file ${candidate.file} has invalid nodeGroups, resetting to empty`);
            importedWorkflow.nodeGroups = [];
        }
        for (const warning of (0, workflow_helpers_1.sanitizeNodeGroupDescriptions)(importedWorkflow)) {
            this.logger.warn(`Workflow file ${candidate.file}: ${warning}`);
        }
        const { versionId, nodes, connections, id, owner, nodeGroups } = importedWorkflow;
        if (!id || !versionId || !nodes || !connections) {
            this.logger.error(`Workflow file ${candidate.file} is missing required fields (id, versionId, nodes, connections)`);
            return;
        }
        const existingWorkflow = existingWorkflows.find((e) => e.id === id);
        if (existingWorkflow) {
            this.deprecatedNodesValidationService.validateOnUpdate(nodes, existingWorkflow.nodes ?? [], id);
        }
        else {
            this.deprecatedNodesValidationService.validateOnCreate(nodes, id);
        }
        await this.redactionEnforcementService.assertPolicyChangeAllowed(existingWorkflow?.settings?.redactionPolicy, importedWorkflow.settings?.redactionPolicy);
        const targetOwnerProject = await this.resolveTargetOwnerProject(owner, personalProject);
        let cleared;
        try {
            cleared = await this.policyEnforcementService.enforceContentImport(workflowImportPolicyContext({ id, name: importedWorkflow.name, nodes }, targetOwnerProject.id), { kind: 'user', user: { id: userId } });
        }
        catch (error) {
            if (!(error instanceof policy_violation_error_1.PolicyViolationError))
                throw error;
            this.logger.warn(`Skipping workflow ${id}: blocked by the content-import policy`);
            return {
                id,
                name: candidate.file,
                contentImportPolicy: { violations: error.violations, checkErrors: [] },
            };
        }
        const { shouldPublishAfterImport, publishingError, publishingErrorDetails } = await this.preparePublishStateForImport(existingWorkflow, importedWorkflow, autoPublish, userId);
        let finalPublishingError = publishingError;
        let finalPublishingErrorDetails = publishingErrorDetails;
        const parentFolderId = importedWorkflow.parentFolderId ?? '';
        this.logger.debug(`Updating workflow id ${id ?? 'new'}`);
        const archivedByPull = !!existingWorkflow && !existingWorkflow.isArchived && !!importedWorkflow.isArchived;
        const localOwner = allSharedWorkflows.find((w) => w.workflowId === id && w.role === 'workflow:owner');
        await this.workflowRepository.upsertImportedContent({
            ...importedWorkflow,
            parentFolder: existingFolderIds.includes(parentFolderId) ? { id: parentFolderId } : null,
        }, { policyCleared: cleared });
        if (archivedByPull) {
            await this.workflowMutationHooks.afterWorkflowArchived(id, null);
        }
        try {
            await this.saveOrUpdateWorkflowHistory({ id, versionId, nodes, connections, nodeGroups }, userId);
        }
        catch (error) {
            const e = (0, ensure_error_1.ensureError)(error);
            this.logger.error(`Failed to save or update workflow history for workflow ${id}`, {
                error: e,
            });
            return;
        }
        await this.syncResourceOwnership({
            resourceId: id,
            remoteOwner: owner,
            localOwner,
            fallbackProject: personalProject,
            repository: this.sharedWorkflowRepository,
            targetOwnerProject,
        });
        if (shouldPublishAfterImport) {
            const publishResult = await this.publishWorkflow(id, versionId, userId);
            if (!publishResult.success) {
                finalPublishingError = publishResult.error;
                finalPublishingErrorDetails = publishResult.errorDetails;
            }
        }
        return {
            id,
            name: candidate.file,
            publishingError: finalPublishingError,
            ...(finalPublishingErrorDetails && {
                publishingErrorDetails: finalPublishingErrorDetails,
            }),
        };
    }
    async parseWorkflowFromFile(file) {
        this.logger.debug(`Parsing workflow file ${file}`);
        try {
            const fileContent = await (0, promises_1.readFile)(file, { encoding: 'utf8' });
            return (0, n8n_workflow_1.jsonParse)(fileContent);
        }
        catch (error) {
            this.logger.error(`Failed to parse workflow file ${file}`, { error });
            throw new n8n_workflow_1.UnexpectedError(`Failed to parse workflow file ${file}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    shouldAutoPublishWorkflow(existingWorkflow, importedWorkflow, autoPublish) {
        return (0, n8n_workflow_1.shouldAutoPublishWorkflow)({
            isNewWorkflow: !existingWorkflow,
            isLocalPublished: !!existingWorkflow?.activeVersionId,
            isRemoteArchived: !!importedWorkflow.isArchived,
            autoPublish,
        });
    }
    mustUnpublishLocalWorkflow(isLocalPublished, isRemoteArchived, shouldAutoPublishRemote) {
        if (!isLocalPublished) {
            return false;
        }
        if (isRemoteArchived) {
            return true;
        }
        return shouldAutoPublishRemote;
    }
    async unpublishWorkflow(workflowId, userId) {
        const user = await this.userRepository.findOne({ where: { id: userId }, relations: ['role'] });
        if (!user) {
            this.logger.error(`User ${userId} not found, cannot unpublish workflow ${workflowId}`);
            return false;
        }
        try {
            this.logger.debug(`Unpublishing workflow id ${workflowId} before import`);
            await this.workflowService.deactivateWorkflow(user, workflowId);
            return true;
        }
        catch (e) {
            const error = (0, ensure_error_1.ensureError)(e);
            this.logger.error(`Failed to unpublish workflow ${workflowId}`, { error });
            return false;
        }
    }
    async publishWorkflow(workflowId, versionId, userId) {
        const user = await this.userRepository.findOne({ where: { id: userId }, relations: ['role'] });
        if (!user) {
            const errorMessage = `User ${userId} not found, cannot publish workflow ${workflowId}`;
            this.logger.error(errorMessage);
            return { success: false, error: errorMessage };
        }
        try {
            this.logger.debug(`Publishing imported workflow id ${workflowId}`);
            await this.workflowService.activateWorkflow(user, workflowId, {
                versionId,
            });
            return { success: true };
        }
        catch (e) {
            const error = (0, ensure_error_1.ensureError)(e);
            this.logger.error(`Failed to publish workflow ${workflowId}`, { error });
            return {
                success: false,
                error: error.message,
                errorDetails: e instanceof workflow_publish_blocked_error_1.WorkflowPublishBlockedError ? e.details : undefined,
            };
        }
    }
    async previewContentImportPolicy(files, userId) {
        if (!this.policyEnforcementService.hasChecksFor('contentImport'))
            return;
        const workflows = (0, source_control_resource_helper_1.getNonDeletedResources)(files, 'workflow');
        const credentials = (0, source_control_resource_helper_1.getNonDeletedResources)(files, 'credential');
        if (workflows.length === 0 && credentials.length === 0)
            return;
        const personalProject = await this.projectRepository.getPersonalProjectForUserOrFail(userId);
        const projectIdByOwner = new Map();
        const targetProjectId = async (owner) => {
            const key = JSON.stringify(owner ?? null);
            let projectId = projectIdByOwner.get(key);
            if (!projectId) {
                projectId = this.findTargetOwnerProjectId(owner, personalProject.id);
                projectIdByOwner.set(key, projectId);
            }
            return await projectId;
        };
        const evaluate = async (file, context) => {
            const { violations, checkErrors = [] } = await this.policyEnforcementService.evaluateContentImport(context);
            if (violations.length > 0 || checkErrors.length > 0) {
                file.contentImportPolicy = { violations, checkErrors };
            }
        };
        await (0, source_control_helper_ee_1.mapInBatches)(workflows, constants_1.SOURCE_CONTROL_READ_FILE_BATCH_SIZE, async (file) => {
            const { id, versionId, name, nodes, connections, owner } = await this.parseWorkflowFromFile(file.file);
            if (!id || !versionId || !nodes || !connections)
                return;
            const projectId = await targetProjectId(owner);
            await evaluate(file, workflowImportPolicyContext({ id, name, nodes }, projectId));
        });
        await (0, source_control_helper_ee_1.mapInBatches)(credentials, constants_1.SOURCE_CONTROL_READ_FILE_BATCH_SIZE, async (file) => {
            const { id, type, ownedBy } = (0, n8n_workflow_1.jsonParse)(await (0, promises_1.readFile)(file.file, { encoding: 'utf8' }));
            const projectId = await targetProjectId(ownedBy);
            await evaluate(file, credentialImportPolicyContext({ id: id ?? null, type }, projectId));
        });
    }
    async importCredentialsFromWorkFolder(candidates, userId) {
        const personalProject = await this.projectRepository.getPersonalProjectForUserOrFail(userId);
        const candidateIds = candidates.map((c) => c.id);
        const existingCredentials = await this.credentialsRepository.find({
            where: {
                id: (0, typeorm_1.In)(candidateIds),
            },
            select: ['id', 'name', 'type', 'data', 'usageScope'],
        });
        const existingCredentialsById = new Map(existingCredentials.map((credential) => [credential.id, credential]));
        const existingSharedCredentials = await this.sharedCredentialsRepository.find({
            select: ['credentialsId', 'projectId', 'role'],
            where: {
                credentialsId: (0, typeorm_1.In)(candidateIds),
                role: 'credential:owner',
            },
        });
        const importCredentialsResult = await Promise.all(candidates.map(async (candidate) => {
            this.logger.debug(`Importing credentials file ${candidate.file}`);
            const credential = (0, n8n_workflow_1.jsonParse)(await (0, promises_1.readFile)(candidate.file, { encoding: 'utf8' }));
            const existingCredentialById = existingCredentialsById.get(credential.id);
            if (credential.usageScope === 'instance' ||
                existingCredentialById?.usageScope === 'instance') {
                this.logger.debug(`Skipping provider connection file ${candidate.file}`);
                return undefined;
            }
            const existingCredential = existingCredentialById?.type === credential.type ? existingCredentialById : undefined;
            const { name, type, data, id, isGlobal = false, isResolvable = false, resolvableAllowFallback = false, } = credential;
            const targetOwnerProject = await this.resolveTargetOwnerProject(credential.ownedBy, personalProject);
            let cleared;
            try {
                cleared = await this.policyEnforcementService.enforceContentImport(credentialImportPolicyContext({ id: credential.id ?? null, type }, targetOwnerProject.id), { kind: 'user', user: { id: userId } });
            }
            catch (error) {
                if (!(error instanceof policy_violation_error_1.PolicyViolationError))
                    throw error;
                this.logger.warn(`Skipping credential ${id}: blocked by policy`);
                return {
                    id,
                    name: candidate.file,
                    type,
                    contentImportPolicy: { violations: error.violations, checkErrors: [] },
                };
            }
            const newCredentialObject = new n8n_core_1.Credentials({ id, name }, type);
            if (existingCredential?.data) {
                const existingDecrypted = new n8n_core_1.Credentials({ id: existingCredential.id, name: existingCredential.name }, existingCredential.type, existingCredential.data);
                const localData = await existingDecrypted.getData();
                const mergedData = (0, source_control_helper_ee_1.mergeRemoteCrendetialDataIntoLocalCredentialData)({
                    local: localData,
                    remote: data,
                });
                await newCredentialObject.setData(mergedData);
            }
            else {
                const sanitizedData = (0, source_control_helper_ee_1.sanitizeCredentialData)(data);
                await newCredentialObject.setData(sanitizedData);
            }
            this.logger.debug(`Updating credential id ${newCredentialObject.id}`);
            await this.credentialsRepository.runInTransaction({}, async (transactionManager, ctx) => {
                await this.credentialsRepository.upsertImportedContent({
                    ...newCredentialObject,
                    isGlobal,
                    isResolvable,
                    resolvableAllowFallback,
                }, { ...ctx, policyCleared: cleared });
                const localOwner = existingSharedCredentials.find((c) => c.credentialsId === credential.id && c.role === 'credential:owner');
                await this.syncResourceOwnership({
                    resourceId: credential.id,
                    remoteOwner: credential.ownedBy,
                    localOwner,
                    fallbackProject: personalProject,
                    repository: this.sharedCredentialsRepository,
                    transactionManager,
                    targetOwnerProject,
                });
            });
            return {
                id: newCredentialObject.id,
                name: newCredentialObject.name,
                type: newCredentialObject.type,
            };
        }));
        return importCredentialsResult.filter((e) => e !== undefined);
    }
    async importTagsFromWorkFolder(candidate, user) {
        let mappedTags;
        try {
            this.logger.debug(`Importing tags from file ${candidate.file}`);
            mappedTags = (0, n8n_workflow_1.jsonParse)(await (0, promises_1.readFile)(candidate.file, { encoding: 'utf8' }), { fallbackValue: { tags: [], mappings: [] } });
        }
        catch (e) {
            const error = (0, ensure_error_1.ensureError)(e);
            this.logger.error(`Failed to import tags from file ${candidate.file}`, { error });
            return;
        }
        if (mappedTags.mappings.length === 0 && mappedTags.tags.length === 0) {
            return;
        }
        const existingWorkflowIds = new Set((await this.workflowRepository.find({
            select: ['id'],
        })).map((e) => e.id));
        await Promise.all(mappedTags.tags.map(async (tag) => {
            const findByName = await this.tagRepository.findOne({
                where: { name: tag.name },
                select: ['id'],
            });
            if (findByName && findByName.id !== tag.id) {
                throw new n8n_workflow_1.UserError(`A tag with the name <strong>${tag.name}</strong> already exists locally.<br />Please either rename the local tag, or the remote one with the id <strong>${tag.id}</strong> in the tags.json file.`);
            }
            const tagCopy = this.tagRepository.create(tag);
            await this.tagRepository.upsert(tagCopy, {
                skipUpdateIfNoValuesChanged: true,
                conflictPaths: { id: true },
            });
        }));
        const context = await this.sourceControlContextFactory.createContext(user);
        const remoteWorkflowIds = (await this.getRemoteVersionIdsFromFiles(context)).map((wf) => wf.id);
        const workflowIdsInImport = [
            ...new Set([
                ...mappedTags.mappings.map((mapping) => String(mapping.workflowId)),
                ...remoteWorkflowIds,
            ]),
        ].filter((workflowId) => existingWorkflowIds.has(workflowId));
        const mappingsToImport = mappedTags.mappings.filter((mapping) => existingWorkflowIds.has(String(mapping.workflowId)));
        await this.workflowTagMappingRepository.manager.transaction(async (transactionManager) => {
            if (workflowIdsInImport.length > 0) {
                await transactionManager.delete(db_1.WorkflowTagMapping, {
                    workflowId: (0, typeorm_1.In)(workflowIdsInImport),
                });
            }
            if (mappingsToImport.length > 0) {
                await transactionManager.upsert(db_1.WorkflowTagMapping, mappingsToImport.map((mapping) => ({
                    tagId: String(mapping.tagId),
                    workflowId: String(mapping.workflowId),
                })), {
                    skipUpdateIfNoValuesChanged: true,
                    conflictPaths: { tagId: true, workflowId: true },
                });
            }
        });
        return mappedTags;
    }
    async importFoldersFromWorkFolder(user, candidate) {
        let mappedFolders;
        const projects = await this.projectRepository.find();
        const personalProject = await this.projectRepository.getPersonalProjectForUserOrFail(user.id);
        try {
            this.logger.debug(`Importing folders from file ${candidate.file}`);
            mappedFolders = (0, n8n_workflow_1.jsonParse)(await (0, promises_1.readFile)(candidate.file, { encoding: 'utf8' }), {
                fallbackValue: { folders: [] },
            });
        }
        catch (e) {
            const error = (0, ensure_error_1.ensureError)(e);
            this.logger.error(`Failed to import folders from file ${candidate.file}`, { error });
            return;
        }
        if (mappedFolders.folders.length === 0) {
            return;
        }
        await Promise.all(mappedFolders.folders.map(async (folder) => {
            const folderCopy = this.folderRepository.create({
                id: folder.id,
                name: folder.name,
                homeProject: {
                    id: projects.find((p) => p.id === folder.homeProjectId)?.id ?? personalProject.id,
                },
            });
            await this.folderRepository.upsert(folderCopy, {
                skipUpdateIfNoValuesChanged: true,
                conflictPaths: { id: true },
            });
        }));
        await Promise.all(mappedFolders.folders.map(async (folder) => {
            await this.folderRepository.update({ id: folder.id }, {
                parentFolder: folder.parentFolderId ? { id: folder.parentFolderId } : null,
                createdAt: folder.createdAt,
                updatedAt: folder.updatedAt,
            });
        }));
        return mappedFolders;
    }
    async importVariables(variables, valueOverrides) {
        const result = { imported: [] };
        const overriddenKeys = Object.keys(valueOverrides ?? {});
        const existingVariables = await this.variablesRepository.find({ select: ['id'] });
        const existingVariableIds = new Set(existingVariables.map(({ id }) => id));
        for (const variable of variables) {
            if (!variable.key) {
                continue;
            }
            if (overriddenKeys.includes(variable.key) && valueOverrides) {
                variable.value = valueOverrides[variable.key];
                overriddenKeys.splice(overriddenKeys.indexOf(variable.key), 1);
            }
            try {
                const isNewVariable = !existingVariableIds.has(variable.id);
                const defaultNewValue = isNewVariable ? '' : undefined;
                const variableToUpsert = {
                    ...variable,
                    value: variable.value === '' ? defaultNewValue : variable.value,
                    project: variable.projectId ? { id: variable.projectId } : null,
                };
                await this.variablesRepository.upsert(variableToUpsert, ['id']);
                if (isNewVariable) {
                    existingVariableIds.add(variable.id);
                }
            }
            catch (errorUpsert) {
                if ((0, response_helper_1.isUniqueConstraintError)(errorUpsert)) {
                    this.logger.debug(`Variable ${variable.key} already exists, updating instead`);
                    try {
                        await this.variablesRepository.update({ key: variable.key }, { ...variable });
                    }
                    catch (errorUpdate) {
                        this.logger.debug(`Failed to update variable ${variable.key}, skipping`);
                        this.logger.debug(errorUpdate.message);
                    }
                }
            }
            finally {
                result.imported.push(variable.key);
            }
        }
        if (overriddenKeys.length > 0 && valueOverrides) {
            for (const key of overriddenKeys) {
                result.imported.push(key);
                const newVariable = this.variablesRepository.create({
                    key,
                    value: valueOverrides[key],
                });
                await this.variablesRepository.save(newVariable, { transaction: false });
            }
        }
        await this.variablesService.updateCache();
        return result;
    }
    async importVariablesFromWorkFolder(candidate, valueOverrides) {
        let importedVariables;
        try {
            this.logger.debug(`Importing variables from file ${candidate.file}`);
            importedVariables = (0, n8n_workflow_1.jsonParse)(await (0, promises_1.readFile)(candidate.file, { encoding: 'utf8' }), { fallbackValue: [] });
        }
        catch (e) {
            this.logger.error(`Failed to import tags from file ${candidate.file}`, { error: e });
            return;
        }
        return await this.importVariables(importedVariables, valueOverrides);
    }
    async importDataTablesFromWorkFolder(candidates, userId) {
        if (candidates.length === 0) {
            return;
        }
        const dbType = this.dataTableRepository.manager.connection.options.type;
        const result = {
            imported: [],
            reconciliationFailures: [],
        };
        const parsedTables = [];
        for (const candidate of candidates) {
            this.logger.debug(`Parsing data table from file ${candidate.file}`);
            let dataTable;
            try {
                dataTable = (0, n8n_workflow_1.jsonParse)(await (0, promises_1.readFile)(candidate.file, { encoding: 'utf8' }));
            }
            catch (error) {
                this.logger.error(`Failed to parse data table from file ${candidate.file}`, {
                    error: (0, ensure_error_1.ensureError)(error),
                });
                continue;
            }
            if (!dataTable || typeof dataTable !== 'object' || !dataTable.id || !dataTable.name) {
                this.logger.warn(`Failed to parse data table from file ${candidate.file}`);
                continue;
            }
            if (!(0, sql_utils_1.isValidDataTableId)(dataTable.id)) {
                this.logger.warn(`Invalid data table ID "${dataTable.id}" in file ${candidate.file}. Skipping.`);
                continue;
            }
            let targetProjectId;
            if (dataTable.ownedBy?.type === 'team') {
                const teamProject = (await this.projectRepository.findOne({
                    where: { id: dataTable.ownedBy.teamId },
                })) ??
                    (await this.createTeamProject({
                        type: 'team',
                        teamId: dataTable.ownedBy.teamId,
                        teamName: dataTable.ownedBy.teamName,
                    }));
                targetProjectId = teamProject.id;
            }
            else {
                targetProjectId = await this.resolveRemoteDataTableProjectId(dataTable.ownedBy, userId);
            }
            parsedTables.push({ dataTable, candidate, targetProjectId });
        }
        const importableTables = [];
        for (const entry of parsedTables) {
            const { dataTable, targetProjectId } = entry;
            const localTable = await this.dataTableRepository.findOne({
                where: { name: dataTable.name, projectId: targetProjectId },
                relations: ['columns'],
            });
            if (localTable && localTable.id !== dataTable.id) {
                try {
                    await this.adoptDataTableIdentity(localTable, dataTable, dbType);
                }
                catch (error) {
                    this.logger.error(`Failed to reconcile data table ${dataTable.name}`, {
                        error: (0, ensure_error_1.ensureError)(error),
                    });
                    result.reconciliationFailures.push({ id: dataTable.id, name: dataTable.name });
                    continue;
                }
            }
            importableTables.push(entry);
        }
        for (const { dataTable, candidate, targetProjectId } of importableTables) {
            try {
                this.logger.debug(`Importing data table from file ${candidate.file}`);
                const existingDataTable = await this.dataTableRepository.findOne({
                    where: { id: dataTable.id },
                    relations: ['columns'],
                });
                const isNewTable = !existingDataTable;
                await this.dataTableRepository.upsert({
                    id: dataTable.id,
                    name: dataTable.name,
                    projectId: targetProjectId,
                    createdAt: dataTable.createdAt,
                    updatedAt: dataTable.updatedAt,
                }, ['id']);
                const existingColumns = await this.dataTableColumnRepository.find({
                    where: { dataTable: { id: dataTable.id } },
                    select: ['id', 'name'],
                });
                const existingColumnIds = new Set(existingColumns.map((c) => c.id));
                const existingColumnNameMap = new Map(existingColumns.map((c) => [c.id, c.name]));
                const importedColumnIds = new Set(dataTable.columns.map((c) => c.id));
                await this.dataTableRepository.manager.transaction(async (trx) => {
                    const columnsToDelete = Array.from(existingColumnIds).filter((id) => !importedColumnIds.has(id));
                    if (columnsToDelete.length > 0) {
                        if (!isNewTable) {
                            for (const columnId of columnsToDelete) {
                                const columnName = existingColumnNameMap.get(columnId);
                                if (columnName) {
                                    await this.dataTableDDLService.dropColumnFromTable(dataTable.id, columnName, dbType, trx);
                                }
                            }
                        }
                        await trx.delete(data_table_column_entity_1.DataTableColumn, { id: (0, typeorm_1.In)(columnsToDelete) });
                    }
                    const columnEntities = [];
                    for (const column of dataTable.columns) {
                        if (!(0, sql_utils_1.isValidColumnName)(column.name)) {
                            this.logger.warn(`Invalid column name "${column.name}" in data table ${dataTable.name}. Skipping column.`);
                            continue;
                        }
                        if (!(0, source_control_helper_ee_1.isValidDataTableColumnType)(column.type)) {
                            this.logger.warn(`Invalid column type "${column.type}" in data table ${dataTable.name}, column ${column.name}. Skipping column.`);
                            continue;
                        }
                        const columnEntity = await trx.save(data_table_column_entity_1.DataTableColumn, {
                            id: column.id,
                            name: column.name,
                            type: column.type,
                            index: column.index,
                            dataTable: { id: dataTable.id },
                        });
                        columnEntities.push(columnEntity);
                        if (!isNewTable && existingColumnIds.has(column.id)) {
                            const oldName = existingColumnNameMap.get(column.id);
                            if (oldName && oldName !== column.name) {
                                await this.dataTableDDLService.renameColumn(dataTable.id, oldName, column.name, dbType, trx);
                            }
                        }
                        if (!isNewTable && !existingColumnIds.has(column.id)) {
                            await this.dataTableDDLService.addColumn(dataTable.id, columnEntity, dbType, trx);
                        }
                    }
                    if (isNewTable) {
                        await this.dataTableDDLService.createTableWithColumns(dataTable.id, columnEntities, trx);
                    }
                });
                result.imported.push(dataTable.name);
            }
            catch (error) {
                this.logger.error(`Failed to import data table ${candidate.name}`, {
                    error: (0, ensure_error_1.ensureError)(error),
                });
            }
        }
        return result;
    }
    async resolveRemoteDataTableProjectId(ownedBy, pullingUserId) {
        if (ownedBy?.type === 'team') {
            return ownedBy.teamId;
        }
        if (ownedBy?.type === 'personal' && ownedBy.personalEmail) {
            const user = await this.userRepository.findOne({
                where: { email: ownedBy.personalEmail },
            });
            if (user) {
                return (await this.projectRepository.getPersonalProjectForUserOrFail(user.id)).id;
            }
            this.logger.debug(`User ${ownedBy.personalEmail} not found locally. Using pulling user's personal project as fallback.`);
        }
        return (await this.projectRepository.getPersonalProjectForUserOrFail(pullingUserId)).id;
    }
    async adoptDataTableIdentity(localTable, incoming, dbType) {
        this.logger.info(`Reconciling data table "${localTable.name}": adopting id ${incoming.id} (was ${localTable.id})`);
        await this.dataTableRepository.manager.transaction(async (trx) => {
            const alreadyRenamed = await this.dataTableDDLService.tableExists(incoming.id, trx);
            if (!alreadyRenamed) {
                await this.dataTableDDLService.renameTable(localTable.id, incoming.id, dbType, trx);
            }
            const { columns: localColumns, ...localTableProps } = localTable;
            await trx.delete(data_table_entity_1.DataTable, { id: localTable.id });
            await trx.insert(data_table_entity_1.DataTable, { ...localTableProps, id: incoming.id });
            const incomingIdByColumnKey = new Map(incoming.columns.map((c) => [(0, source_control_helper_ee_1.getDataTableColumnKey)(c), c.id]));
            for (const column of localColumns) {
                await trx.insert(data_table_column_entity_1.DataTableColumn, {
                    ...column,
                    id: incomingIdByColumnKey.get((0, source_control_helper_ee_1.getDataTableColumnKey)(column)) ?? column.id,
                    dataTableId: incoming.id,
                });
            }
        });
        this.dataTableSizeValidator.reset();
    }
    async importTeamProjectsFromWorkFolder(candidates, pullingUserId) {
        const importResults = [];
        const existingProjectVariables = (await this.variablesService.getAllCached()).filter((v) => v.project);
        for (const candidate of candidates) {
            try {
                this.logger.debug(`Importing project file ${candidate.file}`);
                const project = (0, n8n_workflow_1.jsonParse)(await (0, promises_1.readFile)(candidate.file, { encoding: 'utf8' }));
                if (typeof project.owner !== 'object' ||
                    project.owner.type !== 'team' ||
                    project.owner.teamId !== project.id) {
                    this.logger.warn(`Project ${project.id} has inconsistent owner data, skipping`);
                    continue;
                }
                await this.projectRepository.upsert({
                    id: project.id,
                    name: project.name,
                    icon: project.icon,
                    description: project.description,
                    type: 'team',
                }, ['id']);
                const existingProject = await this.projectRepository.findOne({
                    where: { id: project.id },
                });
                const hasExistingAdmin = existingProject &&
                    (await this.projectRelationRepository.findOne({
                        where: { projectId: project.id, role: { slug: permissions_1.PROJECT_ADMIN_ROLE_SLUG } },
                    }));
                if (!hasExistingAdmin) {
                    await this.projectRelationRepository.save({
                        projectId: project.id,
                        userId: pullingUserId,
                        role: { slug: permissions_1.PROJECT_ADMIN_ROLE_SLUG },
                    });
                    this.logger.debug(`Assigned user ${pullingUserId} as admin for project ${project.name}`);
                }
                await this.importVariables(project.variableStubs?.map((v) => ({ ...v, projectId: project.id })) ?? []);
                const deletedVariables = existingProjectVariables.filter((v) => v.project.id === project.id && !project.variableStubs?.some((vs) => vs.id === v.id));
                await this.variablesService.deleteByIds(deletedVariables.map((v) => v.id));
                this.logger.info(`Imported team project: ${project.name}`);
                importResults.push({
                    id: project.id,
                    name: project.name,
                });
            }
            catch (error) {
                const errorMessage = (0, ensure_error_1.ensureError)(error);
                this.logger.error(`Failed to import project from file ${candidate.file}`, {
                    error: errorMessage,
                });
            }
        }
        return importResults;
    }
    async deleteWorkflowsNotInWorkfolder(user, candidates) {
        for (const candidate of candidates) {
            try {
                await this.unpublishBeforeDelete(candidate.id, user);
                await this.workflowService.delete(user, candidate.id, true);
            }
            catch (error) {
                throw this.deletionError('workflow', [candidate], error);
            }
        }
    }
    async deleteCredentialsNotInWorkfolder(user, candidates) {
        for (const candidate of candidates) {
            const deleted = await this.credentialsService.delete(user, candidate.id, {
                includeInstanceCredentials: true,
            });
            if (!deleted)
                await this.credentialsService.deleteUnowned(user, candidate.id);
        }
    }
    async deleteVariablesNotInWorkfolder(candidates) {
        for (const candidate of candidates) {
            await this.variablesService.delete(candidate.id);
        }
    }
    async deleteDataTablesNotInWorkFolder(candidates) {
        if (candidates.length === 0) {
            return;
        }
        for (const candidate of candidates) {
            await this.dataTableRepository.deleteDataTable(candidate.id);
        }
    }
    async deleteTagsNotInWorkfolder(candidates) {
        for (const candidate of candidates) {
            await this.tagService.delete(candidate.id);
        }
    }
    async deleteFoldersNotInWorkfolder(candidates) {
        if (candidates.length === 0) {
            return;
        }
        const candidateIds = candidates.map((c) => c.id);
        try {
            const folderIds = [...candidateIds];
            for (const folderId of candidateIds) {
                folderIds.push(...(await this.folderRepository.getAllFolderIdsInHierarchy(folderId)));
            }
            const workflows = await this.workflowRepository.find({
                select: ['id'],
                where: { parentFolder: { id: (0, typeorm_1.In)(folderIds) } },
            });
            const cascadedWorkflowIds = await this.deactivateWorkflowsAndHardDeleteExecutions(workflows.map((workflow) => workflow.id));
            await this.deleteWithCallerAllowlistPurge(async (trx) => {
                await trx.delete(db_1.Folder, { id: (0, typeorm_1.In)(candidateIds) });
            });
            await this.sweepAfterWorkflowCascade(cascadedWorkflowIds);
        }
        catch (error) {
            throw this.deletionError('folder', candidates, error);
        }
    }
    async deleteTeamProjectsNotInWorkfolder(user, candidates, credentialsInWorkfolder) {
        if (candidates.length === 0) {
            return;
        }
        const candidateIds = candidates.map((c) => c.id);
        try {
            const ownedCredentials = await this.sharedCredentialsRepository.findOwnedCredentialsByProjects(candidateIds);
            const credentialIdsInWorkfolder = new Set(credentialsInWorkfolder.map((c) => c.id));
            for (const credential of ownedCredentials) {
                if (credentialIdsInWorkfolder.has(credential.id)) {
                    this.logger.warn(`Keeping credential ${credential.id} of deleted project: it was not imported into its new project`);
                    continue;
                }
                await this.credentialsService.delete(user, credential.id);
            }
            const ownedWorkflows = await this.sharedWorkflowRepository.find({
                select: ['workflowId'],
                where: { projectId: (0, typeorm_1.In)(candidateIds), role: 'workflow:owner' },
            });
            const cascadedWorkflowIds = await this.deactivateWorkflowsAndHardDeleteExecutions(ownedWorkflows.map((sw) => sw.workflowId));
            await this.deleteWithCallerAllowlistPurge(async (trx) => {
                await trx.delete(db_1.Project, { id: (0, typeorm_1.In)(candidateIds) });
            });
            await this.sweepAfterWorkflowCascade(cascadedWorkflowIds);
        }
        catch (error) {
            throw this.deletionError('project', candidates, error);
        }
    }
    async deactivateWorkflowsAndHardDeleteExecutions(workflowIds) {
        const workflows = [];
        for (const workflowId of workflowIds) {
            const workflow = await this.workflowRepository.findOne({
                select: ['id', 'activeVersionId'],
                where: { id: workflowId },
            });
            if (workflow)
                workflows.push(workflow);
        }
        for (const workflow of workflows) {
            await this.workflowMutationHooks.beforeWorkflowDeleted(workflow.id, null);
        }
        for (const workflow of workflows) {
            if (workflow.activeVersionId !== null) {
                await this.workflowService.deactivateWorkflowAsSystem(workflow.id);
            }
            await this.waitForUnpublishToSettle(workflow.id);
            await this.executionPersistence.hardDeleteByWorkflowId(workflow.id);
        }
        return workflows.map((workflow) => workflow.id);
    }
    async unpublishBeforeDelete(workflowId, user) {
        const deletable = await this.workflowFinderService.findWorkflowForUser(workflowId, user, [
            'workflow:delete',
        ]);
        if (!deletable)
            return;
        await this.workflowService.deactivateWorkflow(user, workflowId);
        await this.waitForUnpublishToSettle(workflowId);
    }
    async waitForUnpublishToSettle(workflowId) {
        const deadline = Date.now() + UNPUBLISH_SETTLE_TIMEOUT_MS;
        while ((await this.workflowPublishedVersionRepository.getPublishedVersionId(workflowId)) !== null) {
            if (Date.now() >= deadline) {
                throw new n8n_workflow_1.OperationalError(`Timed out waiting for workflow "${workflowId}" to unpublish before deletion`);
            }
            await (0, sleep_1.sleep)(UNPUBLISH_SETTLE_POLL_INTERVAL_MS);
        }
    }
    async sweepAfterWorkflowCascade(cascadedWorkflowIds) {
        if (cascadedWorkflowIds.length === 0)
            return;
        await this.workflowMutationHooks.afterWorkflowsDeleted(cascadedWorkflowIds);
    }
    async deleteWithCallerAllowlistPurge(deleteRows) {
        await this.workflowRepository.runInTransaction({}, async (trx, ctx) => {
            await deleteRows(trx);
            await this.workflowRepository.removeMissingFromCallerAllowlists(ctx);
        });
    }
    deletionError(type, candidates, error) {
        const maxListed = 10;
        const resources = candidates
            .slice(0, maxListed)
            .map((c) => `"${c.name}" (${c.id})`)
            .join(', ');
        const overflow = candidates.length > maxListed ? ` and ${candidates.length - maxListed} more` : '';
        const message = `Failed to delete ${type}(s) ${resources}${overflow} while pulling from source control: ${(0, ensure_error_1.ensureError)(error).message}`;
        this.errorReporter.error((0, ensure_error_1.ensureError)(error), { extra: { message } });
        return new n8n_workflow_1.UnexpectedError(message, { cause: error });
    }
    async syncResourceOwnership({ resourceId, remoteOwner, localOwner, fallbackProject, repository, transactionManager, targetOwnerProject, }) {
        targetOwnerProject ??= await this.resolveTargetOwnerProject(remoteOwner, fallbackProject);
        const trx = transactionManager ?? this.workflowRepository.manager;
        const shouldRemoveOldOwner = localOwner && localOwner.projectId !== targetOwnerProject.id;
        if (shouldRemoveOldOwner) {
            await repository.deleteByIds([resourceId], localOwner.projectId, trx);
        }
        await repository.makeOwner([resourceId], targetOwnerProject.id, trx);
        return targetOwnerProject;
    }
    async resolveTargetOwnerProject(remoteOwner, fallbackProject) {
        const targetOwnerProject = await this.findOwnerProjectInLocalDb(remoteOwner ?? undefined);
        if (targetOwnerProject)
            return targetOwnerProject;
        const isSharedResource = remoteOwner && typeof remoteOwner !== 'string' && remoteOwner.type === 'team';
        return isSharedResource ? await this.createTeamProject(remoteOwner) : fallbackProject;
    }
    async findTargetOwnerProjectId(remoteOwner, fallbackProjectId) {
        const project = await this.findOwnerProjectInLocalDb(remoteOwner ?? undefined);
        if (project)
            return project.id;
        const isSharedResource = remoteOwner && typeof remoteOwner !== 'string' && remoteOwner.type === 'team';
        return isSharedResource ? remoteOwner.teamId : fallbackProjectId;
    }
    async findOwnerProjectInLocalDb(owner) {
        if (!owner) {
            return null;
        }
        if (typeof owner === 'string' || owner.type === 'personal') {
            const email = typeof owner === 'string' ? owner : owner.personalEmail;
            const user = await this.userRepository.findOne({ where: { email } });
            if (!user) {
                return null;
            }
            return await this.projectRepository.getPersonalProjectForUserOrFail(user.id);
        }
        else if (owner.type === 'team') {
            return await this.projectRepository.findOne({
                where: { id: owner.teamId },
            });
        }
        (0, utils_1.assertNever)(owner);
        const errorOwner = owner;
        throw new n8n_workflow_1.UnexpectedError(`Unknown resource owner type "${typeof errorOwner !== 'string' ? errorOwner.type : 'UNKNOWN'}" found when finding owner project`);
    }
    async createTeamProject(owner) {
        let teamProject = null;
        try {
            teamProject = await this.projectRepository.save(this.projectRepository.create({
                id: owner.teamId,
                name: owner.teamName,
                type: 'team',
            }));
        }
        catch (error) {
            teamProject = await this.projectRepository.findOne({
                where: { id: owner.teamId },
            });
            if (!teamProject) {
                throw error;
            }
        }
        return teamProject;
    }
    async saveOrUpdateWorkflowHistory(importedWorkflow, userId) {
        const { versionId, nodes, connections, nodeGroups, id } = importedWorkflow;
        const user = await this.userRepository.findOne({ where: { id: userId } });
        const authors = user ? `import by ${user.firstName} ${user.lastName}` : 'import';
        const existingVersion = await this.workflowHistoryService.findVersion(id, versionId);
        if (existingVersion) {
            const nodesChanged = !(0, isEqual_1.default)(existingVersion.nodes, nodes);
            const connectionsChanged = !(0, isEqual_1.default)(existingVersion.connections, connections);
            const nodeGroupsChanged = !(0, isEqual_1.default)(existingVersion.nodeGroups, nodeGroups);
            if (nodesChanged || connectionsChanged || nodeGroupsChanged) {
                await this.workflowHistoryService.updateVersion(id, versionId, {
                    nodes,
                    connections,
                    nodeGroups,
                    authors,
                });
            }
        }
        else {
            await this.workflowHistoryService.saveVersion(authors, { versionId, nodes, connections, nodeGroups }, id);
        }
    }
    async preparePublishStateForImport(existingWorkflow, importedWorkflow, autoPublish, userId) {
        const shouldAutoPublishRemote = this.shouldAutoPublishWorkflow(existingWorkflow, importedWorkflow, autoPublish);
        const isLocalPublished = !!existingWorkflow?.activeVersionId;
        const isRemoteArchived = !!importedWorkflow.isArchived;
        const mustUnpublishLocal = this.mustUnpublishLocalWorkflow(isLocalPublished, isRemoteArchived, shouldAutoPublishRemote);
        let unpublishedLocal = false;
        let publishingError;
        let publishingErrorDetails;
        if (mustUnpublishLocal && shouldAutoPublishRemote && existingWorkflow) {
            try {
                await this.workflowPublishGuard.assertCanPublish(existingWorkflow.id);
            }
            catch (error) {
                if (!(error instanceof workflow_publish_blocked_error_1.WorkflowPublishBlockedError))
                    throw error;
                publishingError = error.message;
                publishingErrorDetails = error.details;
            }
        }
        if (mustUnpublishLocal && existingWorkflow && !publishingErrorDetails) {
            unpublishedLocal = await this.unpublishWorkflow(existingWorkflow.id, userId);
            if (!unpublishedLocal) {
                publishingError = 'Failed to unpublish workflow before import';
            }
        }
        const shouldPublishAfterImport = !publishingErrorDetails &&
            shouldAutoPublishRemote &&
            (!mustUnpublishLocal || unpublishedLocal);
        this.resolvePublishedStatus(importedWorkflow, existingWorkflow, mustUnpublishLocal, unpublishedLocal);
        return { shouldPublishAfterImport, publishingError, publishingErrorDetails };
    }
    resolvePublishedStatus(importedWorkflow, existingWorkflow, mustUnpublishLocal, unpublishedLocal) {
        const existingWorkflowActiveVersionId = existingWorkflow?.activeVersionId;
        const isExistingArchived = !!existingWorkflow?.isArchived;
        const shouldPreserve = !isExistingArchived &&
            !!existingWorkflowActiveVersionId &&
            (!mustUnpublishLocal || !unpublishedLocal);
        if (shouldPreserve) {
            importedWorkflow.active = !!existingWorkflowActiveVersionId;
            importedWorkflow.activeVersionId = existingWorkflowActiveVersionId;
        }
        else {
            importedWorkflow.active = false;
            importedWorkflow.activeVersionId = null;
        }
    }
};
exports.SourceControlImportService = SourceControlImportService;
exports.SourceControlImportService = SourceControlImportService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, n8n_core_1.ErrorReporter, variables_service_ee_1.VariablesService, db_1.CredentialsRepository, db_1.ProjectRepository, db_1.ProjectRelationRepository, db_1.TagRepository, db_1.SharedWorkflowRepository, db_1.SharedCredentialsRepository, db_1.UserRepository, db_1.VariablesRepository, db_1.WorkflowRepository, db_1.WorkflowTagMappingRepository, workflow_service_1.WorkflowService, credentials_service_1.CredentialsService, tag_service_1.TagService, db_1.FolderRepository, n8n_core_1.InstanceSettings, source_control_context_factory_1.SourceControlContextFactory, source_control_scoped_service_1.SourceControlScopedService, workflow_history_service_1.WorkflowHistoryService, data_table_repository_1.DataTableRepository, data_table_column_repository_1.DataTableColumnRepository, data_table_ddl_service_1.DataTableDDLService, redaction_enforcement_service_1.RedactionEnforcementService, policy_enforcement_service_1.PolicyEnforcementService, data_table_size_validator_service_1.DataTableSizeValidator, db_1.WorkflowPublishedVersionRepository, execution_persistence_1.ExecutionPersistence, backend_services_1.WorkflowPublishGuardProxy, backend_services_1.WorkflowMutationHooksProxy, workflow_finder_service_1.WorkflowFinderService, deprecated_nodes_validation_service_1.DeprecatedNodesValidationService])
], SourceControlImportService);
//# sourceMappingURL=source-control-import.service.ee.js.map