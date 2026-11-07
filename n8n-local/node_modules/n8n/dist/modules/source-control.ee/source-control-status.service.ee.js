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
exports.SourceControlStatusService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const permissions_1 = require("@n8n/permissions");
const typeorm_1 = require("@n8n/typeorm");
const pick_1 = __importDefault(require("lodash/pick"));
const n8n_workflow_1 = require("n8n-workflow");
const errors_1 = require("@n8n/errors");
const constants_1 = require("./constants");
const source_control_context_factory_1 = require("./source-control-context.factory");
const source_control_git_service_ee_1 = require("./source-control-git.service.ee");
const source_control_helper_ee_1 = require("./source-control-helper.ee");
const source_control_import_service_ee_1 = require("./source-control-import.service.ee");
const source_control_preferences_service_ee_1 = require("./source-control-preferences.service.ee");
let SourceControlStatusService = class SourceControlStatusService {
    constructor(logger, gitService, sourceControlImportService, sourceControlPreferencesService, sourceControlContextFactory, tagRepository, folderRepository, workflowRepository, eventService) {
        this.logger = logger;
        this.gitService = gitService;
        this.sourceControlImportService = sourceControlImportService;
        this.sourceControlPreferencesService = sourceControlPreferencesService;
        this.sourceControlContextFactory = sourceControlContextFactory;
        this.tagRepository = tagRepository;
        this.folderRepository = folderRepository;
        this.workflowRepository = workflowRepository;
        this.eventService = eventService;
    }
    get gitFolder() {
        return this.sourceControlPreferencesService.gitFolder;
    }
    get dataTableExportFolder() {
        return `${this.gitFolder}/${constants_1.SOURCE_CONTROL_DATATABLES_EXPORT_FOLDER}`;
    }
    convertToStatusResourceOwner(owner) {
        if (!owner) {
            return;
        }
        if (owner.type === 'personal') {
            return;
        }
        if ('teamId' in owner && 'teamName' in owner) {
            return {
                type: 'team',
                projectId: owner.teamId,
                projectName: owner.teamName,
            };
        }
        if ('projectId' in owner) {
            return owner;
        }
        return;
    }
    buildFolderPath(parentFolderId, foldersById) {
        if (!parentFolderId) {
            return [];
        }
        const pathSegments = [];
        const visited = new Set();
        let currentFolderId = parentFolderId;
        while (currentFolderId && !visited.has(currentFolderId)) {
            visited.add(currentFolderId);
            const folder = foldersById.get(currentFolderId);
            if (!folder) {
                break;
            }
            pathSegments.unshift(folder.name);
            currentFolderId = folder.parentFolderId;
        }
        return pathSegments;
    }
    async getStatus(user, options) {
        const context = await this.sourceControlContextFactory.createContext(user);
        const collectVerbose = options?.verbose ?? false;
        if (options.direction === 'pull' && !(0, permissions_1.hasGlobalScope)(user, 'sourceControl:pull')) {
            throw new errors_1.ForbiddenError('You do not have permission to pull from source control');
        }
        if (options.direction === 'push' &&
            !(0, permissions_1.hasGlobalScope)(user, 'sourceControl:push') &&
            context.authorizedProjects.length === 0) {
            throw new errors_1.ForbiddenError('You do not have permission to push to source control');
        }
        await this.resetWorkfolder();
        const remoteFolders = await this.sourceControlImportService.getRemoteFoldersAndMappingsFromFile(context);
        const [workflowsResult, credentialsResult, variablesResult, dataTablesResult, tagsMappingsResult, foldersMappingResult, projectsResult,] = await Promise.all([
            this.getStatusWorkflows(options, context, collectVerbose, remoteFolders),
            this.getStatusCredentials(options, context, collectVerbose),
            this.getStatusVariables(options, collectVerbose),
            this.getStatusDataTables(options, context, collectVerbose),
            this.getStatusTagsMappings(options, context, collectVerbose),
            this.getStatusFoldersMapping(options, context, collectVerbose, remoteFolders),
            this.getStatusProjects(options, context, collectVerbose),
        ]);
        const sourceControlledFiles = [
            ...workflowsResult.files,
            ...credentialsResult.files,
            ...variablesResult.files,
            ...dataTablesResult.files,
            ...tagsMappingsResult.files,
            ...foldersMappingResult.files,
            ...projectsResult.files,
        ];
        const publicApi = options.origin === 'publicApi';
        if (options.direction === 'push') {
            const trackingInformation = (0, source_control_helper_ee_1.getTrackingInformationFromPrePushResult)(user.id, sourceControlledFiles);
            this.eventService.emit('source-control-user-started-push-ui', {
                ...trackingInformation,
                publicApi,
            });
        }
        else if (options.direction === 'pull') {
            const trackingInformation = (0, source_control_helper_ee_1.getTrackingInformationFromPullResult)(user.id, sourceControlledFiles);
            this.eventService.emit('source-control-user-started-pull-ui', {
                ...trackingInformation,
                publicApi,
            });
        }
        if (collectVerbose) {
            return {
                ...workflowsResult.verbose,
                ...credentialsResult.verbose,
                ...variablesResult.verbose,
                ...dataTablesResult.verbose,
                ...tagsMappingsResult.verbose,
                ...foldersMappingResult.verbose,
                ...projectsResult.verbose,
                sourceControlledFiles,
            };
        }
        return sourceControlledFiles;
    }
    async resetWorkfolder() {
        try {
            if (!this.gitService.git) {
                throw new Error('Git service not initialized');
            }
            await this.gitService.resetBranch();
            await this.gitService.pull();
        }
        catch (error) {
            this.logger.error(`Failed to reset workfolder: ${error instanceof Error ? error.message : String(error)}`);
            throw new n8n_workflow_1.UserError(`Unable to fetch updates from git - your folder might be out of sync. Try reconnecting from the Source Control settings page. Git error message: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async populateMissingLocalFolderPathNodes(localFoldersById, localWorkflows) {
        const getMissingFolderIds = (folderIds) => {
            const missingFolderIds = folderIds.filter((id) => id !== null && !localFoldersById.has(id));
            return new Set(missingFolderIds);
        };
        const initialParentFolderIds = localWorkflows.map((workflow) => workflow.parentFolderId);
        const folderIdsToProcessQueue = getMissingFolderIds(initialParentFolderIds);
        while (folderIdsToProcessQueue.size > 0) {
            const currentBatchFolderIds = Array.from(folderIdsToProcessQueue);
            folderIdsToProcessQueue.clear();
            const loadedFolders = await this.folderRepository.find({
                where: { id: (0, typeorm_1.In)(currentBatchFolderIds) },
                relations: ['parentFolder'],
                select: {
                    id: true,
                    name: true,
                    parentFolder: {
                        id: true,
                    },
                },
            });
            loadedFolders.forEach((folder) => {
                localFoldersById.set(folder.id, {
                    name: folder.name,
                    parentFolderId: folder.parentFolder?.id ?? null,
                });
            });
            const parentFolderIds = loadedFolders.map((folder) => folder.parentFolder?.id ?? null);
            const missingParentFolderIds = getMissingFolderIds(parentFolderIds);
            missingParentFolderIds.forEach((folderId) => {
                folderIdsToProcessQueue.add(folderId);
            });
        }
    }
    async getStatusWorkflows(options, context, collectVerbose, prefetchedRemoteFolders) {
        const sourceControlledFiles = [];
        const [wfRemoteVersionIds, wfLocalVersionIds, foldersMappingsLocal] = await Promise.all([
            this.sourceControlImportService.getRemoteVersionIdsFromFiles(context),
            this.sourceControlImportService.getLocalVersionIdsFromDb(context),
            this.sourceControlImportService.getLocalFoldersAndMappingsFromDb(context),
        ]);
        const remoteFoldersById = new Map(prefetchedRemoteFolders.folders.map((folder) => [
            folder.id,
            (0, pick_1.default)(folder, ['name', 'parentFolderId']),
        ]));
        const localFoldersById = new Map(foldersMappingsLocal.folders.map((folder) => [
            folder.id,
            (0, pick_1.default)(folder, ['name', 'parentFolderId']),
        ]));
        await this.populateMissingLocalFolderPathNodes(localFoldersById, wfLocalVersionIds);
        const wfRemoteById = new Map(wfRemoteVersionIds.map((w) => [w.id, w]));
        const wfRemoteIds = new Set(wfRemoteVersionIds.map((w) => w.id));
        const wfLocalIds = new Set(wfLocalVersionIds.map((w) => w.id));
        const candidateIds = [...new Set([...wfLocalIds, ...wfRemoteIds])];
        const localWorkflowsWithStatus = await this.workflowRepository.findByIds(candidateIds, {
            fields: ['id', 'activeVersionId'],
        });
        const publishedWorkflowIds = new Set(localWorkflowsWithStatus.filter((w) => !!w.activeVersionId).map((w) => w.id));
        const archivedWorkflowIds = new Map(wfRemoteVersionIds.filter((w) => w.isRemoteArchived).map((w) => [w.id, true]));
        let outOfScopeWF = [];
        if (!context.hasAccessToAllProjects()) {
            outOfScopeWF = await this.sourceControlImportService.getAllLocalVersionIdsFromDb();
            outOfScopeWF = outOfScopeWF.filter((wf) => !wfLocalIds.has(wf.id));
        }
        const outOfScopeIds = new Set(outOfScopeWF.map((wf) => wf.id));
        const wfMissingInLocal = [];
        const wfMissingInRemote = [];
        const wfModifiedInEither = [];
        for (const remoteWorkflow of wfRemoteVersionIds) {
            if (!wfLocalIds.has(remoteWorkflow.id) && !outOfScopeIds.has(remoteWorkflow.id)) {
                if (collectVerbose) {
                    wfMissingInLocal.push(remoteWorkflow);
                }
                sourceControlledFiles.push({
                    id: remoteWorkflow.id,
                    name: remoteWorkflow.name ?? 'Workflow',
                    type: 'workflow',
                    status: options.direction === 'push' ? 'deleted' : 'created',
                    location: options.direction === 'push' ? 'local' : 'remote',
                    conflict: false,
                    file: remoteWorkflow.filename,
                    updatedAt: remoteWorkflow.updatedAt ?? new Date().toISOString(),
                    isLocalPublished: false,
                    isRemoteArchived: archivedWorkflowIds.get(remoteWorkflow.id) ?? false,
                    parentFolderId: remoteWorkflow.parentFolderId,
                    folderPath: this.buildFolderPath(remoteWorkflow.parentFolderId, remoteFoldersById),
                    owner: remoteWorkflow.owner,
                });
            }
        }
        for (const localWorkflow of wfLocalVersionIds) {
            const remoteWorkflowWithSameId = wfRemoteById.get(localWorkflow.id);
            if (!remoteWorkflowWithSameId) {
                if (collectVerbose) {
                    wfMissingInRemote.push(localWorkflow);
                }
                sourceControlledFiles.push({
                    id: localWorkflow.id,
                    name: localWorkflow.name ?? 'Workflow',
                    type: 'workflow',
                    status: options.direction === 'push' ? 'created' : 'deleted',
                    location: options.direction === 'push' ? 'local' : 'remote',
                    conflict: options.direction === 'push' ? false : true,
                    file: localWorkflow.filename,
                    updatedAt: localWorkflow.updatedAt ?? new Date().toISOString(),
                    isLocalPublished: publishedWorkflowIds.has(localWorkflow.id),
                    isRemoteArchived: false,
                    parentFolderId: localWorkflow.parentFolderId,
                    folderPath: this.buildFolderPath(localWorkflow.parentFolderId, localFoldersById),
                    owner: localWorkflow.owner,
                });
                continue;
            }
            if (!(0, source_control_helper_ee_1.isWorkflowModified)(localWorkflow, remoteWorkflowWithSameId, options.direction)) {
                continue;
            }
            let name = (options?.preferLocalVersion ? localWorkflow?.name : remoteWorkflowWithSameId?.name) ??
                'Workflow';
            if (localWorkflow.name &&
                remoteWorkflowWithSameId?.name &&
                localWorkflow.name !== remoteWorkflowWithSameId.name) {
                name = options?.preferLocalVersion
                    ? `${localWorkflow.name} (Remote: ${remoteWorkflowWithSameId.name})`
                    : (name = `${remoteWorkflowWithSameId.name} (Local: ${localWorkflow.name})`);
            }
            const preferredParentFolderId = options.preferLocalVersion
                ? localWorkflow.parentFolderId
                : remoteWorkflowWithSameId.parentFolderId;
            const preferredFolderPath = this.buildFolderPath(preferredParentFolderId, options.preferLocalVersion ? localFoldersById : remoteFoldersById);
            const remoteFolderPath = this.buildFolderPath(remoteWorkflowWithSameId.parentFolderId, remoteFoldersById);
            const wfModified = {
                ...localWorkflow,
                name,
                parentFolderId: preferredParentFolderId,
                versionId: options.preferLocalVersion
                    ? localWorkflow.versionId
                    : remoteWorkflowWithSameId.versionId,
                localId: localWorkflow.versionId,
                remoteId: remoteWorkflowWithSameId.versionId,
            };
            if (collectVerbose) {
                wfModifiedInEither.push(wfModified);
            }
            sourceControlledFiles.push({
                id: wfModified.id,
                name: wfModified.name ?? 'Workflow',
                type: 'workflow',
                status: 'modified',
                location: options.direction === 'push' ? 'local' : 'remote',
                conflict: true,
                file: wfModified.filename,
                updatedAt: wfModified.updatedAt ?? new Date().toISOString(),
                isLocalPublished: publishedWorkflowIds.has(wfModified.id),
                isRemoteArchived: archivedWorkflowIds.get(wfModified.id) ?? false,
                parentFolderId: preferredParentFolderId,
                folderPath: preferredFolderPath,
                remoteFolderPath,
                owner: wfModified.owner,
            });
        }
        return {
            files: sourceControlledFiles,
            verbose: {
                wfRemoteVersionIds,
                wfLocalVersionIds,
                wfMissingInLocal,
                wfMissingInRemote,
                wfModifiedInEither,
            },
        };
    }
    async getStatusCredentials(options, context, collectVerbose) {
        const sourceControlledFiles = [];
        const credRemoteIds = await this.sourceControlImportService.getRemoteCredentialsFromFiles(context);
        const credLocalIds = await this.sourceControlImportService.getLocalCredentialsFromDb(context);
        const credRemoteById = new Map(credRemoteIds.map((cred) => [cred.id, cred]));
        const credLocalIdsSet = new Set(credLocalIds.map((cred) => cred.id));
        const credMissingInLocal = [];
        const credMissingInRemote = [];
        const credModifiedInEither = [];
        for (const remoteCredential of credRemoteIds) {
            if (!credLocalIdsSet.has(remoteCredential.id)) {
                if (collectVerbose) {
                    credMissingInLocal.push(remoteCredential);
                }
                sourceControlledFiles.push({
                    id: remoteCredential.id,
                    name: remoteCredential.name ?? 'Credential',
                    type: 'credential',
                    status: options.direction === 'push' ? 'deleted' : 'created',
                    location: options.direction === 'push' ? 'local' : 'remote',
                    conflict: false,
                    file: remoteCredential.filename,
                    updatedAt: new Date().toISOString(),
                    owner: remoteCredential.ownedBy,
                });
            }
        }
        for (const localCredential of credLocalIds) {
            const credRemote = credRemoteById.get(localCredential.id);
            if (credRemote) {
                if ((0, source_control_helper_ee_1.areSameCredentials)(localCredential, credRemote)) {
                    continue;
                }
                const modifiedCredential = {
                    ...localCredential,
                    name: options?.preferLocalVersion ? localCredential.name : credRemote.name,
                };
                if (collectVerbose) {
                    credModifiedInEither.push(modifiedCredential);
                }
                sourceControlledFiles.push({
                    id: modifiedCredential.id,
                    name: modifiedCredential.name ?? 'Credential',
                    type: 'credential',
                    status: 'modified',
                    location: options.direction === 'push' ? 'local' : 'remote',
                    conflict: true,
                    file: modifiedCredential.filename,
                    updatedAt: new Date().toISOString(),
                    owner: modifiedCredential.ownedBy,
                });
            }
            else {
                if (collectVerbose) {
                    credMissingInRemote.push(localCredential);
                }
                sourceControlledFiles.push({
                    id: localCredential.id,
                    name: localCredential.name ?? 'Credential',
                    type: 'credential',
                    status: options.direction === 'push' ? 'created' : 'deleted',
                    location: options.direction === 'push' ? 'local' : 'remote',
                    conflict: options.direction === 'push' ? false : true,
                    file: localCredential.filename,
                    updatedAt: new Date().toISOString(),
                    owner: localCredential.ownedBy,
                });
            }
        }
        return {
            files: sourceControlledFiles,
            verbose: {
                credMissingInLocal,
                credMissingInRemote,
                credModifiedInEither,
            },
        };
    }
    async getStatusVariables(options, collectVerbose) {
        const sourceControlledFiles = [];
        const varRemoteIds = await this.sourceControlImportService.getRemoteVariablesFromFile();
        const varLocalIds = await this.sourceControlImportService.getLocalGlobalVariablesFromDb();
        const varRemoteIdsSet = new Set(varRemoteIds.map((remote) => remote.id));
        const varLocalIdsSet = new Set(varLocalIds.map((local) => local.id));
        const varMissingInLocal = [];
        const varMissingInRemote = [];
        const varModifiedInEither = [];
        for (const remoteVariable of varRemoteIds) {
            if (!varLocalIdsSet.has(remoteVariable.id)) {
                if (collectVerbose) {
                    varMissingInLocal.push(remoteVariable);
                }
                sourceControlledFiles.push({
                    id: remoteVariable.id,
                    name: remoteVariable.key,
                    type: 'variables',
                    status: options.direction === 'push' ? 'deleted' : 'created',
                    location: options.direction === 'push' ? 'local' : 'remote',
                    conflict: false,
                    file: (0, source_control_helper_ee_1.getVariablesPath)(this.gitFolder),
                    updatedAt: new Date().toISOString(),
                });
            }
        }
        for (const localVariable of varLocalIds) {
            if (!varRemoteIdsSet.has(localVariable.id)) {
                if (collectVerbose) {
                    varMissingInRemote.push(localVariable);
                }
                sourceControlledFiles.push({
                    id: localVariable.id,
                    name: localVariable.key,
                    type: 'variables',
                    status: options.direction === 'push' ? 'created' : 'deleted',
                    location: options.direction === 'push' ? 'local' : 'remote',
                    conflict: options.direction === 'push' ? false : true,
                    file: (0, source_control_helper_ee_1.getVariablesPath)(this.gitFolder),
                    updatedAt: new Date().toISOString(),
                });
            }
        }
        for (const localVariable of varLocalIds) {
            const mismatchingIds = varRemoteIds.find((remote) => (remote.id === localVariable.id && remote.key !== localVariable.key) ||
                (remote.id !== localVariable.id && remote.key === localVariable.key));
            if (!mismatchingIds) {
                continue;
            }
            const modified = options.preferLocalVersion ? localVariable : mismatchingIds;
            if (collectVerbose) {
                varModifiedInEither.push(modified);
            }
            sourceControlledFiles.push({
                id: modified.id,
                name: modified.key,
                type: 'variables',
                status: 'modified',
                location: options.direction === 'push' ? 'local' : 'remote',
                conflict: true,
                file: (0, source_control_helper_ee_1.getVariablesPath)(this.gitFolder),
                updatedAt: new Date().toISOString(),
            });
        }
        return {
            files: sourceControlledFiles,
            verbose: {
                varMissingInLocal,
                varMissingInRemote,
                varModifiedInEither,
            },
        };
    }
    async getStatusDataTables(options, context, collectVerbose) {
        const sourceControlledFiles = [];
        const dataTablesRemote = (await this.sourceControlImportService.getRemoteDataTablesFromFiles(context)) ?? [];
        const dataTablesLocal = (await this.sourceControlImportService.getLocalDataTablesFromDb(context)) ?? [];
        const localById = new Map(dataTablesLocal.map((dt) => [dt.id, dt]));
        const remoteById = new Map(dataTablesRemote.map((dt) => [dt.id, dt]));
        const remotesByName = new Map();
        for (const dt of dataTablesRemote) {
            const sameName = remotesByName.get(dt.name);
            if (sameName) {
                sameName.push(dt);
            }
            else {
                remotesByName.set(dt.name, [dt]);
            }
        }
        const dtMissingInLocal = [];
        const dtMissingInRemote = [];
        const dtModifiedInEither = [];
        const nameCollisionByLocalId = new Map();
        for (const local of dataTablesLocal) {
            if (remoteById.has(local.id) || !local.ownedBy)
                continue;
            for (const candidate of remotesByName.get(local.name) ?? []) {
                if (candidate.id === local.id)
                    continue;
                const candidateProjectId = await this.sourceControlImportService.resolveRemoteDataTableProjectId(candidate.ownedBy, context.user.id);
                if (candidateProjectId === local.ownedBy.projectId) {
                    nameCollisionByLocalId.set(local.id, candidate);
                    break;
                }
            }
        }
        const collidingRemoteIds = new Set([...nameCollisionByLocalId.values()].map((remote) => remote.id));
        for (const remote of dataTablesRemote) {
            if (!localById.has(remote.id)) {
                if (options.direction === 'pull' && collidingRemoteIds.has(remote.id)) {
                    continue;
                }
                if (collectVerbose) {
                    dtMissingInLocal.push(remote);
                }
                sourceControlledFiles.push({
                    id: remote.id,
                    name: remote.name,
                    type: 'datatable',
                    status: options.direction === 'push' ? 'deleted' : 'created',
                    location: options.direction === 'push' ? 'local' : 'remote',
                    conflict: false,
                    file: (0, source_control_helper_ee_1.getDataTableExportPath)(remote.id, this.dataTableExportFolder),
                    updatedAt: new Date().toISOString(),
                    owner: this.convertToStatusResourceOwner(remote.ownedBy),
                });
            }
        }
        for (const local of dataTablesLocal) {
            const remote = remoteById.get(local.id);
            if (!remote) {
                const nameCollision = nameCollisionByLocalId.get(local.id);
                if (nameCollision) {
                    const isPull = options.direction === 'pull';
                    const modified = isPull ? nameCollision : local;
                    if (collectVerbose) {
                        dtModifiedInEither.push(modified);
                    }
                    sourceControlledFiles.push({
                        id: modified.id,
                        name: modified.name,
                        type: 'datatable',
                        status: 'modified',
                        location: options.direction === 'push' ? 'local' : 'remote',
                        conflict: true,
                        file: (0, source_control_helper_ee_1.getDataTableExportPath)(modified.id, this.dataTableExportFolder),
                        updatedAt: new Date().toISOString(),
                        owner: this.convertToStatusResourceOwner(modified.ownedBy),
                    });
                    if (isPull) {
                        continue;
                    }
                }
                if (collectVerbose) {
                    dtMissingInRemote.push(local);
                }
                sourceControlledFiles.push({
                    id: local.id,
                    name: local.name,
                    type: 'datatable',
                    status: options.direction === 'push' ? 'created' : 'deleted',
                    location: options.direction === 'push' ? 'local' : 'remote',
                    conflict: options.direction !== 'push',
                    file: (0, source_control_helper_ee_1.getDataTableExportPath)(local.id, this.dataTableExportFolder),
                    updatedAt: new Date().toISOString(),
                    owner: local.ownedBy ?? undefined,
                });
                continue;
            }
            const isModified = (0, source_control_helper_ee_1.isDataTableModified)(local, remote);
            if (isModified) {
                const modified = options.preferLocalVersion ? local : remote;
                if (collectVerbose) {
                    dtModifiedInEither.push(modified);
                }
                sourceControlledFiles.push({
                    id: modified.id,
                    name: modified.name,
                    type: 'datatable',
                    status: 'modified',
                    location: options.direction === 'push' ? 'local' : 'remote',
                    conflict: true,
                    file: (0, source_control_helper_ee_1.getDataTableExportPath)(modified.id, this.dataTableExportFolder),
                    updatedAt: new Date().toISOString(),
                    owner: this.convertToStatusResourceOwner(modified.ownedBy),
                });
            }
        }
        return {
            files: sourceControlledFiles,
            verbose: {
                dtMissingInLocal,
                dtMissingInRemote,
                dtModifiedInEither,
            },
        };
    }
    async getStatusTagsMappings(options, context, collectVerbose) {
        const sourceControlledFiles = [];
        const lastUpdatedTag = await this.tagRepository.find({
            order: { updatedAt: 'DESC' },
            take: 1,
            select: ['updatedAt'],
        });
        const lastUpdatedDate = lastUpdatedTag[0]?.updatedAt ?? new Date();
        const tagMappingsRemote = await this.sourceControlImportService.getRemoteTagsAndMappingsFromFile(context);
        const tagMappingsLocal = await this.sourceControlImportService.getLocalTagsAndMappingsFromDb(context);
        const tagsMissingInLocal = [];
        const tagsMissingInRemote = [];
        const tagsModifiedInEither = [];
        const mappingsMissingInLocal = [];
        const mappingsMissingInRemote = [];
        let tagsMissingInLocalCount = 0;
        let tagsMissingInRemoteCount = 0;
        let tagsModifiedInEitherCount = 0;
        let mappingsMissingInLocalCount = 0;
        let mappingsMissingInRemoteCount = 0;
        for (const remote of tagMappingsRemote.tags) {
            if (tagMappingsLocal.tags.findIndex((local) => local.id === remote.id) === -1) {
                tagsMissingInLocalCount += 1;
                if (collectVerbose) {
                    tagsMissingInLocal.push(remote);
                }
                sourceControlledFiles.push({
                    id: remote.id,
                    name: remote.name,
                    type: 'tags',
                    status: options.direction === 'push' ? 'deleted' : 'created',
                    location: options.direction === 'push' ? 'local' : 'remote',
                    conflict: false,
                    file: (0, source_control_helper_ee_1.getTagsPath)(this.gitFolder),
                    updatedAt: lastUpdatedDate.toISOString(),
                });
            }
        }
        for (const localTag of tagMappingsLocal.tags) {
            if (tagMappingsRemote.tags.findIndex((remote) => remote.id === localTag.id) === -1) {
                tagsMissingInRemoteCount += 1;
                if (collectVerbose) {
                    tagsMissingInRemote.push(localTag);
                }
                sourceControlledFiles.push({
                    id: localTag.id,
                    name: localTag.name,
                    type: 'tags',
                    status: options.direction === 'push' ? 'created' : 'deleted',
                    location: options.direction === 'push' ? 'local' : 'remote',
                    conflict: options.direction === 'push' ? false : true,
                    file: (0, source_control_helper_ee_1.getTagsPath)(this.gitFolder),
                    updatedAt: lastUpdatedDate.toISOString(),
                });
            }
        }
        for (const localTag of tagMappingsLocal.tags) {
            const mismatchingIds = tagMappingsRemote.tags.find((remote) => remote.id === localTag.id && remote.name !== localTag.name);
            if (!mismatchingIds) {
                continue;
            }
            tagsModifiedInEitherCount += 1;
            const modified = options.preferLocalVersion ? localTag : mismatchingIds;
            if (collectVerbose) {
                tagsModifiedInEither.push(modified);
            }
            sourceControlledFiles.push({
                id: modified.id,
                name: modified.name,
                type: 'tags',
                status: 'modified',
                location: options.direction === 'push' ? 'local' : 'remote',
                conflict: true,
                file: (0, source_control_helper_ee_1.getTagsPath)(this.gitFolder),
                updatedAt: lastUpdatedDate.toISOString(),
            });
        }
        for (const remoteTagMapping of tagMappingsRemote.mappings) {
            const isMissing = tagMappingsLocal.mappings.findIndex((local) => local.tagId === remoteTagMapping.tagId &&
                local.workflowId === remoteTagMapping.workflowId);
            if (isMissing === -1) {
                mappingsMissingInLocalCount += 1;
                if (collectVerbose) {
                    mappingsMissingInLocal.push(remoteTagMapping);
                }
            }
        }
        for (const localTagMapping of tagMappingsLocal.mappings) {
            const isMissing = tagMappingsRemote.mappings.findIndex((remote) => remote.tagId === localTagMapping.tagId &&
                remote.workflowId === localTagMapping.workflowId);
            if (isMissing === -1) {
                mappingsMissingInRemoteCount += 1;
                if (collectVerbose) {
                    mappingsMissingInRemote.push(localTagMapping);
                }
            }
        }
        const hasMappingChanges = mappingsMissingInLocalCount > 0 || mappingsMissingInRemoteCount > 0;
        const hasTagChanges = tagsMissingInLocalCount > 0 || tagsMissingInRemoteCount > 0 || tagsModifiedInEitherCount > 0;
        if (hasMappingChanges && !hasTagChanges) {
            const isConflict = options.direction === 'pull' && mappingsMissingInRemoteCount > 0;
            sourceControlledFiles.push({
                id: 'tags',
                name: 'Workflow Tags',
                type: 'tags',
                status: 'modified',
                location: options.direction === 'push' ? 'local' : 'remote',
                conflict: isConflict,
                file: (0, source_control_helper_ee_1.getTagsPath)(this.gitFolder),
                updatedAt: lastUpdatedDate.toISOString(),
            });
        }
        return {
            files: sourceControlledFiles,
            verbose: {
                tagsMissingInLocal,
                tagsMissingInRemote,
                tagsModifiedInEither,
                mappingsMissingInLocal,
                mappingsMissingInRemote,
            },
        };
    }
    async getStatusFoldersMapping(options, context, collectVerbose, prefetchedRemoteFolders) {
        const sourceControlledFiles = [];
        const lastUpdatedFolder = await this.folderRepository.find({
            order: { updatedAt: 'DESC' },
            take: 1,
            select: ['updatedAt'],
        });
        const lastUpdatedDate = lastUpdatedFolder[0]?.updatedAt ?? new Date();
        const foldersMappingsRemote = prefetchedRemoteFolders;
        const foldersMappingsLocal = await this.sourceControlImportService.getLocalFoldersAndMappingsFromDb(context);
        const foldersMissingInLocal = [];
        const foldersMissingInRemote = [];
        const allTeamProjects = await this.sourceControlImportService.getLocalTeamProjectsFromDb();
        const foldersModifiedInEither = [];
        for (const remoteFolder of foldersMappingsRemote.folders) {
            if (foldersMappingsLocal.folders.findIndex((local) => local.id === remoteFolder.id) === -1) {
                if (collectVerbose) {
                    foldersMissingInLocal.push(remoteFolder);
                }
                sourceControlledFiles.push({
                    id: remoteFolder.id,
                    name: remoteFolder.name,
                    type: 'folders',
                    status: options.direction === 'push' ? 'deleted' : 'created',
                    location: options.direction === 'push' ? 'local' : 'remote',
                    conflict: false,
                    file: (0, source_control_helper_ee_1.getFoldersPath)(this.gitFolder),
                    updatedAt: lastUpdatedDate.toISOString(),
                });
            }
        }
        for (const localFolder of foldersMappingsLocal.folders) {
            if (foldersMappingsRemote.folders.findIndex((remote) => remote.id === localFolder.id) === -1) {
                if (collectVerbose) {
                    foldersMissingInRemote.push(localFolder);
                }
                sourceControlledFiles.push({
                    id: localFolder.id,
                    name: localFolder.name,
                    type: 'folders',
                    status: options.direction === 'push' ? 'created' : 'deleted',
                    location: options.direction === 'push' ? 'local' : 'remote',
                    conflict: options.direction === 'push' ? false : true,
                    file: (0, source_control_helper_ee_1.getFoldersPath)(this.gitFolder),
                    updatedAt: lastUpdatedDate.toISOString(),
                });
            }
        }
        const teamProjectsById = new Map(allTeamProjects.map((project) => [project.id, project]));
        for (const localFolder of foldersMappingsLocal.folders) {
            const localHomeProject = teamProjectsById.get(localFolder.homeProjectId);
            const mismatchingIds = foldersMappingsRemote.folders.find((remote) => {
                const remoteHomeProject = teamProjectsById.get(remote.homeProjectId);
                const localOwner = localHomeProject
                    ? {
                        type: 'team',
                        projectId: localHomeProject.id,
                        projectName: localHomeProject.name,
                    }
                    : undefined;
                const remoteOwner = remoteHomeProject
                    ? {
                        type: 'team',
                        projectId: remoteHomeProject?.id,
                        projectName: remoteHomeProject?.name,
                    }
                    : undefined;
                const ownerChanged = (0, source_control_helper_ee_1.hasOwnerChanged)(localOwner, remoteOwner);
                return (remote.id === localFolder.id &&
                    (remote.name !== localFolder.name ||
                        remote.parentFolderId !== localFolder.parentFolderId ||
                        ownerChanged));
            });
            if (!mismatchingIds) {
                continue;
            }
            const modified = options.preferLocalVersion ? localFolder : mismatchingIds;
            if (collectVerbose) {
                foldersModifiedInEither.push(modified);
            }
            sourceControlledFiles.push({
                id: modified.id,
                name: modified.name,
                type: 'folders',
                status: 'modified',
                location: options.direction === 'push' ? 'local' : 'remote',
                conflict: true,
                file: (0, source_control_helper_ee_1.getFoldersPath)(this.gitFolder),
                updatedAt: lastUpdatedDate.toISOString(),
            });
        }
        return {
            files: sourceControlledFiles,
            verbose: {
                foldersMissingInLocal,
                foldersMissingInRemote,
                foldersModifiedInEither,
            },
        };
    }
    async getStatusProjects(options, context, collectVerbose) {
        const sourceControlledFiles = [];
        const projectsRemote = await this.sourceControlImportService.getRemoteProjectsFromFiles(context);
        const projectsLocal = await this.sourceControlImportService.getLocalTeamProjectsFromDb(context);
        let outOfScopeProjects = [];
        if (!context.hasAccessToAllProjects()) {
            outOfScopeProjects = await this.sourceControlImportService.getLocalTeamProjectsFromDb();
            outOfScopeProjects = outOfScopeProjects.filter((project) => !projectsLocal.some((local) => local.id === project.id));
        }
        const projectsMissingInLocal = [];
        const areRemoteProjectsEmpty = projectsRemote.length === 0;
        const projectsMissingInRemote = [];
        const projectsModifiedInEither = [];
        const projectLocalIds = new Set(projectsLocal.map((localProject) => localProject.id));
        const projectRemoteById = new Map(projectsRemote.map((remoteProject) => [remoteProject.id, remoteProject]));
        const outOfScopeProjectIds = new Set(outOfScopeProjects.map((outOfScope) => outOfScope.id));
        const mapExportableProjectWithFileNameToSourceControlledFile = ({ project, status, conflict, }) => {
            return {
                id: project.id,
                name: project.name ?? 'Project',
                type: 'project',
                status,
                location: options.direction === 'push' ? 'local' : 'remote',
                conflict,
                file: project.filename,
                updatedAt: new Date().toISOString(),
                owner: {
                    type: project.owner.type,
                    projectId: project.owner.teamId,
                    projectName: project.owner.teamName,
                },
            };
        };
        for (const remoteProject of projectsRemote) {
            if (!projectLocalIds.has(remoteProject.id) && !outOfScopeProjectIds.has(remoteProject.id)) {
                if (collectVerbose) {
                    projectsMissingInLocal.push(remoteProject);
                }
                sourceControlledFiles.push(mapExportableProjectWithFileNameToSourceControlledFile({
                    project: remoteProject,
                    status: options.direction === 'push' ? 'deleted' : 'created',
                    conflict: false,
                }));
            }
        }
        if (!(options.direction === 'pull' && areRemoteProjectsEmpty)) {
            for (const localProject of projectsLocal) {
                if (!projectRemoteById.has(localProject.id)) {
                    if (collectVerbose) {
                        projectsMissingInRemote.push(localProject);
                    }
                    sourceControlledFiles.push(mapExportableProjectWithFileNameToSourceControlledFile({
                        project: localProject,
                        status: options.direction === 'push' ? 'created' : 'deleted',
                        conflict: options.direction === 'push' ? false : true,
                    }));
                }
            }
        }
        projectsLocal.forEach((localProject) => {
            const remoteProjectWithSameId = projectRemoteById.get(localProject.id);
            if (!remoteProjectWithSameId) {
                return;
            }
            if (this.isProjectModified(localProject, remoteProjectWithSameId)) {
                let name = (options?.preferLocalVersion ? localProject?.name : remoteProjectWithSameId?.name) ??
                    'Project';
                if (localProject.name &&
                    remoteProjectWithSameId?.name &&
                    localProject.name !== remoteProjectWithSameId.name) {
                    name = options?.preferLocalVersion
                        ? `${localProject.name} (Remote: ${remoteProjectWithSameId.name})`
                        : `${remoteProjectWithSameId.name} (Local: ${localProject.name})`;
                }
                const modified = {
                    ...localProject,
                    name,
                    description: options.preferLocalVersion
                        ? localProject.description
                        : remoteProjectWithSameId.description,
                    icon: options.preferLocalVersion ? localProject.icon : remoteProjectWithSameId.icon,
                    variableStubs: options.preferLocalVersion
                        ? localProject.variableStubs
                        : remoteProjectWithSameId.variableStubs,
                };
                if (collectVerbose) {
                    projectsModifiedInEither.push(modified);
                }
                sourceControlledFiles.push(mapExportableProjectWithFileNameToSourceControlledFile({
                    project: modified,
                    status: 'modified',
                    conflict: true,
                }));
            }
        });
        return {
            files: sourceControlledFiles,
            verbose: {
                projectsRemote,
                projectsLocal,
                projectsMissingInLocal,
                projectsMissingInRemote,
                projectsModifiedInEither,
            },
        };
    }
    areVariablesEqual(localVariables, remoteVariables) {
        if (Array.isArray(localVariables) !== Array.isArray(remoteVariables)) {
            return false;
        }
        if (localVariables?.length !== remoteVariables?.length) {
            return false;
        }
        const sortedLocalVars = [...(localVariables ?? [])].sort((a, b) => a.key.localeCompare(b.key));
        const sortedRemoteVars = [...(remoteVariables ?? [])].sort((a, b) => a.key.localeCompare(b.key));
        return sortedLocalVars.every((localVar, index) => {
            const remoteVar = sortedRemoteVars[index];
            return localVar.key === remoteVar.key && localVar.type === remoteVar.type;
        });
    }
    isProjectModified(local, remote) {
        const isIconModified = this.isProjectIconModified({
            localIcon: local.icon,
            remoteIcon: remote.icon,
        });
        return (isIconModified ||
            remote.type !== local.type ||
            remote.name !== local.name ||
            remote.description !== local.description ||
            !this.areVariablesEqual(local.variableStubs, remote.variableStubs));
    }
    isProjectIconModified({ localIcon, remoteIcon, }) {
        if (!remoteIcon && !!localIcon)
            return true;
        if (!!remoteIcon && !localIcon)
            return true;
        if (!!remoteIcon && !!localIcon) {
            return remoteIcon.type !== localIcon.type || remoteIcon.value !== localIcon.value;
        }
        return false;
    }
};
exports.SourceControlStatusService = SourceControlStatusService;
exports.SourceControlStatusService = SourceControlStatusService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, source_control_git_service_ee_1.SourceControlGitService, source_control_import_service_ee_1.SourceControlImportService, source_control_preferences_service_ee_1.SourceControlPreferencesService, source_control_context_factory_1.SourceControlContextFactory, db_1.TagRepository, db_1.FolderRepository, db_1.WorkflowRepository, backend_services_1.EventService])
], SourceControlStatusService);
//# sourceMappingURL=source-control-status.service.ee.js.map