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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SourceControlService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const fs_1 = require("fs");
const n8n_workflow_1 = require("n8n-workflow");
const p_limit_1 = __importDefault(require("p-limit"));
const path = __importStar(require("path"));
const errors_1 = require("@n8n/errors");
const constants_1 = require("./constants");
const source_control_context_factory_1 = require("./source-control-context.factory");
const source_control_export_service_ee_1 = require("./source-control-export.service.ee");
const source_control_git_service_ee_1 = require("./source-control-git.service.ee");
const source_control_helper_ee_1 = require("./source-control-helper.ee");
const source_control_import_service_ee_1 = require("./source-control-import.service.ee");
const source_control_preferences_service_ee_1 = require("./source-control-preferences.service.ee");
const source_control_resource_helper_1 = require("./source-control-resource-helper");
const source_control_scoped_service_1 = require("./source-control-scoped.service");
const source_control_status_service_ee_1 = require("./source-control-status.service.ee");
let SourceControlService = class SourceControlService {
    constructor(logger, gitService, sourceControlPreferencesService, sourceControlExportService, sourceControlImportService, sourceControlContextFactory, sourceControlScopedService, eventService, sourceControlStatusService) {
        this.logger = logger;
        this.gitService = gitService;
        this.sourceControlPreferencesService = sourceControlPreferencesService;
        this.sourceControlExportService = sourceControlExportService;
        this.sourceControlImportService = sourceControlImportService;
        this.sourceControlContextFactory = sourceControlContextFactory;
        this.sourceControlScopedService = sourceControlScopedService;
        this.eventService = eventService;
        this.sourceControlStatusService = sourceControlStatusService;
        this.isReloading = false;
        this.workfolderMutex = (0, p_limit_1.default)(1);
        const { gitFolder, sshFolder, sshKeyName } = sourceControlPreferencesService;
        this.gitFolder = gitFolder;
        this.sshFolder = sshFolder;
        this.sshKeyName = sshKeyName;
    }
    async start() {
        await this.refreshServiceState();
    }
    isHostKeyVerificationError(error) {
        const message = error.message.toLowerCase();
        return (message.includes('host key verification failed') ||
            message.includes('host identification has changed') ||
            message.includes('offending key'));
    }
    async refreshServiceState() {
        this.gitService.resetService();
        (0, source_control_helper_ee_1.sourceControlFoldersExistCheck)([this.gitFolder, this.sshFolder]);
        await this.sourceControlPreferencesService.loadFromDbAndApplySourceControlPreferences();
        if (this.sourceControlPreferencesService.isSourceControlLicensedAndEnabled()) {
            await this.initGitService();
        }
    }
    async reloadConfiguration() {
        if (this.isReloading) {
            this.logger.warn('Source control configuration reload already in progress');
            return;
        }
        this.isReloading = true;
        try {
            this.logger.debug('Source control configuration changed, reloading from database');
            const wasConnected = this.sourceControlPreferencesService.isSourceControlConnected();
            await this.refreshServiceState();
            const isNowConnected = this.sourceControlPreferencesService.isSourceControlConnected();
            if (wasConnected && !isNowConnected) {
                await this.sourceControlExportService.deleteRepositoryFolder();
                this.logger.info('Cleaned up git repository folder after source control disconnect');
            }
        }
        finally {
            this.isReloading = false;
        }
    }
    async initGitService() {
        await this.gitService.initService({
            sourceControlPreferences: this.sourceControlPreferencesService.getPreferences(),
            gitFolder: this.gitFolder,
            sshKeyName: this.sshKeyName,
            sshFolder: this.sshFolder,
        });
    }
    async sanityCheck() {
        try {
            const foldersExisted = (0, source_control_helper_ee_1.sourceControlFoldersExistCheck)([this.gitFolder, this.sshFolder], false);
            if (!foldersExisted) {
                throw new n8n_workflow_1.UserError('No folders exist');
            }
            if (!this.gitService.git) {
                await this.initGitService();
            }
            const branches = await this.gitService.getCurrentBranch();
            if (branches.current === '' ||
                branches.current !==
                    this.sourceControlPreferencesService.sourceControlPreferences.branchName) {
                throw new n8n_workflow_1.UserError('Branch is not set up correctly');
            }
        }
        catch (error) {
            throw new errors_1.BadRequestError('Source control is not properly set up, please disconnect and reconnect.');
        }
    }
    async disconnect(options = {}) {
        try {
            const preferences = this.sourceControlPreferencesService.getPreferences();
            await this.sourceControlPreferencesService.setPreferences({
                connected: false,
                branchName: '',
                repositoryUrl: '',
                branchReadOnly: false,
                branchColor: constants_1.SOURCE_CONTROL_DEFAULT_BRANCH_COLOR,
                connectionType: preferences.connectionType,
            });
            await this.sourceControlExportService.deleteRepositoryFolder();
            if (preferences.connectionType === 'https') {
                await this.sourceControlPreferencesService.deleteHttpsCredentials();
            }
            else if (!options.keepKeyPair) {
                await this.sourceControlPreferencesService.deleteKeyPair();
            }
            await this.sourceControlPreferencesService.resetKnownHosts();
            this.gitService.resetService();
            return this.sourceControlPreferencesService.sourceControlPreferences;
        }
        catch (error) {
            throw new n8n_workflow_1.UnexpectedError('Failed to disconnect from source control', { cause: error });
        }
    }
    async initializeRepository(preferences, user) {
        if (!this.gitService.git) {
            await this.initGitService();
        }
        this.logger.debug('Initializing repository...');
        await this.gitService.initRepository(preferences, user);
        let getBranchesResult;
        try {
            getBranchesResult = await this.getBranches();
        }
        catch (error) {
            if (error.message.includes('Warning: Permanently added')) {
                this.logger.debug('Added repository host to the list of known hosts. Retrying...');
                getBranchesResult = await this.getBranches();
            }
            else if (this.isHostKeyVerificationError(error)) {
                throw new n8n_workflow_1.UserError("SSH host key verification failed. The remote server's key may have changed. " +
                    'If this is expected (e.g., server migration), disconnect and reconnect from Source Control settings to reset the known hosts.');
            }
            else {
                throw error;
            }
        }
        if (getBranchesResult.branches.includes(preferences.branchName)) {
            await this.gitService.setBranch(preferences.branchName);
        }
        else {
            if (getBranchesResult.branches?.length === 0) {
                try {
                    (0, fs_1.writeFileSync)(path.join(this.gitFolder, '/README.md'), constants_1.SOURCE_CONTROL_README);
                    await this.gitService.stage(new Set(['README.md']));
                    await this.gitService.commit('Initial commit');
                    await this.gitService.push({
                        branch: preferences.branchName,
                        force: true,
                    });
                    getBranchesResult = await this.getBranches();
                    await this.gitService.setBranch(preferences.branchName);
                }
                catch (fileError) {
                    this.logger.error(`Failed to create initial commit: ${fileError.message}`);
                }
            }
        }
        await this.sourceControlPreferencesService.setPreferences({
            branchName: getBranchesResult.currentBranch,
            connected: true,
        });
        return getBranchesResult;
    }
    async getBranches() {
        if (!this.gitService.git) {
            await this.initGitService();
        }
        await this.gitService.fetch();
        return await this.gitService.getBranches();
    }
    async setBranch(branch) {
        if (!this.gitService.git) {
            await this.initGitService();
        }
        await this.sourceControlPreferencesService.setPreferences({
            branchName: branch,
            connected: branch?.length > 0,
        });
        return await this.gitService.setBranch(branch);
    }
    async resetWorkfolder() {
        return await this.workfolderMutex(async () => await this.resetWorkfolderWithoutLock());
    }
    async resetWorkfolderWithoutLock() {
        if (!this.gitService.git) {
            await this.initGitService();
        }
        try {
            await this.gitService.resetBranch();
            await this.gitService.pull();
        }
        catch (error) {
            this.logger.error(`Failed to reset workfolder: ${error.message}`);
            throw new n8n_workflow_1.UserError('Unable to fetch updates from git - your folder might be out of sync. Try reconnecting from the Source Control settings page.');
        }
        return;
    }
    async pushWorkfolder(user, options, origin = 'ui') {
        return await this.workfolderMutex(async () => await this.pushWorkfolderWithoutLock(user, options, origin));
    }
    async resolveAuthorizedFilesToPush(user, requestedFiles, origin) {
        const allowedResources = await this.sourceControlStatusService.getStatus(user, {
            direction: 'push',
            verbose: false,
            preferLocalVersion: true,
            origin,
        });
        let filesToPush = allowedResources;
        if (requestedFiles.length) {
            const allowedKeys = new Set(allowedResources.map((allowed) => `${allowed.type}:${allowed.id}`));
            const requestedKeys = new Set();
            for (const requested of requestedFiles) {
                const key = `${requested.type}:${requested.id}`;
                if (!allowedKeys.has(key)) {
                    throw new errors_1.ForbiddenError('You are not allowed to push these changes');
                }
                requestedKeys.add(key);
            }
            filesToPush = allowedResources.filter((allowed) => requestedKeys.has(`${allowed.type}:${allowed.id}`));
        }
        return filesToPush.map((file) => ({
            ...file,
            file: (0, source_control_helper_ee_1.normalizeAndValidateSourceControlledFilePath)(this.gitFolder, file.file),
        }));
    }
    async pushWorkfolderWithoutLock(user, options, origin = 'ui') {
        await this.sanityCheck();
        if (this.sourceControlPreferencesService.isBranchReadOnly()) {
            throw new errors_1.BadRequestError('Cannot push onto read-only branch.');
        }
        const context = await this.sourceControlContextFactory.createContext(user);
        const filesToPush = await this.resolveAuthorizedFilesToPush(user, options.fileNames, origin);
        let statusResult = filesToPush;
        if (!options.force) {
            const possibleConflicts = filesToPush?.filter((file) => file.conflict);
            if (possibleConflicts?.length > 0) {
                return {
                    statusCode: 409,
                    pushResult: undefined,
                    statusResult: filesToPush,
                };
            }
        }
        try {
            const filesToBePushed = new Set();
            const filesToBeDeleted = new Set();
            filesToPush
                .filter((f) => ['workflow', 'credential', 'project', 'datatable'].includes(f.type))
                .forEach((e) => {
                if (e.status !== 'deleted') {
                    filesToBePushed.add(e.file);
                }
                else {
                    filesToBeDeleted.add(e.file);
                }
            });
            await this.sourceControlExportService.rmFilesFromExportFolder(filesToBeDeleted);
            const workflowsToBeExported = (0, source_control_resource_helper_1.getNonDeletedResources)(filesToPush, 'workflow');
            await this.sourceControlExportService.exportWorkflowsToWorkFolder(workflowsToBeExported);
            const credentialsToBeExported = (0, source_control_resource_helper_1.getNonDeletedResources)(filesToPush, 'credential');
            const credentialExportResult = await this.sourceControlExportService.exportCredentialsToWorkFolder(credentialsToBeExported);
            if (credentialExportResult.missingIds && credentialExportResult.missingIds.length > 0) {
                credentialExportResult.missingIds.forEach((id) => {
                    filesToBePushed.delete(this.sourceControlExportService.getCredentialsPath(id));
                    statusResult = statusResult.filter((e) => e.file !== this.sourceControlExportService.getCredentialsPath(id));
                });
            }
            const projectsToBeExported = (0, source_control_resource_helper_1.getNonDeletedResources)(filesToPush, 'project');
            await this.sourceControlExportService.exportTeamProjectsToWorkFolder(projectsToBeExported);
            filesToBePushed.add((0, source_control_helper_ee_1.getTagsPath)(this.gitFolder));
            await this.sourceControlExportService.exportTagsToWorkFolder(context);
            const folderChanges = (0, source_control_resource_helper_1.filterByType)(filesToPush, 'folders')[0];
            if (folderChanges) {
                filesToBePushed.add(folderChanges.file);
                await this.sourceControlExportService.exportFoldersToWorkFolder(context);
            }
            const variablesChanges = (0, source_control_resource_helper_1.filterByType)(filesToPush, 'variables')[0];
            if (variablesChanges) {
                filesToBePushed.add(variablesChanges.file);
                await this.sourceControlExportService.exportGlobalVariablesToWorkFolder();
            }
            const dataTableCandidates = (0, source_control_resource_helper_1.filterByType)(filesToPush, 'datatable');
            if (dataTableCandidates.length > 0) {
                await this.sourceControlExportService.exportDataTablesToWorkFolder(dataTableCandidates, context);
            }
            await this.gitService.stage(filesToBePushed, filesToBeDeleted);
            await this.gitService.setGitUserDetails(user.firstName && user.lastName
                ? `${user.firstName} ${user.lastName}`
                : constants_1.SOURCE_CONTROL_DEFAULT_NAME, user.email || constants_1.SOURCE_CONTROL_DEFAULT_EMAIL);
            await this.gitService.commit(options.commitMessage ?? 'Updated Workfolder');
        }
        catch (error) {
            this.logger.error('Failed to export or commit changes', { error });
            try {
                await this.gitService.resetBranch({ hard: true, target: 'HEAD' });
            }
            catch (resetError) {
                this.logger.error('Failed to reset branch after export/commit error', {
                    error: resetError,
                });
            }
            throw error;
        }
        const branchName = this.sourceControlPreferencesService.getBranchName();
        let pushResult;
        try {
            pushResult = await this.gitService.push({
                branch: branchName,
                force: options.force ?? false,
            });
            statusResult.forEach((result) => (result.pushed = true));
        }
        catch (error) {
            this.logger.error('Failed to push changes', { error });
            try {
                await this.gitService.resetBranch({ hard: true, target: `origin/${branchName}` });
            }
            catch (resetError) {
                this.logger.error('Failed to reset branch after push error', { error: resetError });
            }
            throw error;
        }
        this.eventService.emit('source-control-user-finished-push-ui', {
            ...(0, source_control_helper_ee_1.getTrackingInformationFromPostPushResult)(user.id, statusResult),
            publicApi: origin === 'publicApi',
        });
        return {
            statusCode: 200,
            pushResult,
            statusResult,
        };
    }
    async pullWorkfolder(user, options) {
        return await this.workfolderMutex(async () => await this.pullWorkfolderWithoutLock(user, options));
    }
    async pullWorkfolderWithoutLock(user, options) {
        await this.sanityCheck();
        const statusResult = await this.sourceControlStatusService.getStatus(user, {
            direction: 'pull',
            verbose: false,
            preferLocalVersion: false,
        });
        if (options.force !== true) {
            const possibleConflicts = statusResult.filter((file) => file.conflict || file.status === 'modified');
            if (possibleConflicts?.length > 0) {
                await this.gitService.resetBranch();
                return {
                    statusCode: 409,
                    statusResult,
                };
            }
        }
        const projectsToBeImported = (0, source_control_resource_helper_1.getNonDeletedResources)(statusResult, 'project');
        this.logger.debug(`[Project Debug] Found ${projectsToBeImported.length} projects to import: ${JSON.stringify(projectsToBeImported.map((p) => ({ id: p.id, name: p.name })))}`);
        await this.sourceControlImportService.importTeamProjectsFromWorkFolder(projectsToBeImported, user.id);
        const foldersToBeImported = (0, source_control_resource_helper_1.getNonDeletedResources)(statusResult, 'folders')[0];
        if (foldersToBeImported) {
            await this.sourceControlImportService.importFoldersFromWorkFolder(user, foldersToBeImported);
        }
        const credentialsToBeImported = (0, source_control_resource_helper_1.getNonDeletedResources)(statusResult, 'credential');
        const credentialImportResults = await this.sourceControlImportService.importCredentialsFromWorkFolder(credentialsToBeImported, user.id);
        const statusByCredentialId = new Map(statusResult.filter((item) => item.type === 'credential').map((item) => [item.id, item]));
        for (const { id, contentImportPolicy } of credentialImportResults) {
            if (!contentImportPolicy)
                continue;
            if (contentImportPolicy.violations.length) {
                this.logger.warn(`Skipped credential ${id}: ${contentImportPolicy.violations.length} policy violation(s)`, { violations: contentImportPolicy.violations });
            }
            const statusItem = statusByCredentialId.get(id);
            if (statusItem) {
                statusItem.contentImportPolicy = contentImportPolicy;
            }
        }
        const workflowsToBeImported = (0, source_control_resource_helper_1.getNonDeletedResources)(statusResult, 'workflow');
        const workflowImportResults = await this.sourceControlImportService.importWorkflowFromWorkFolder(workflowsToBeImported, user.id, options.autoPublish);
        const statusByWorkflowId = new Map(statusResult.filter((item) => item.type === 'workflow').map((item) => [item.id, item]));
        for (const { id, publishingError, publishingErrorDetails, contentImportPolicy, } of workflowImportResults) {
            const statusItem = statusByWorkflowId.get(id);
            if (contentImportPolicy?.violations.length) {
                this.logger.warn(`Skipped workflow ${id}: ${contentImportPolicy.violations.length} content-import policy violation(s)`, { violations: contentImportPolicy.violations });
            }
            else {
                this.eventService.emit('workflow-imported', { workflowId: id });
            }
            if (contentImportPolicy && statusItem) {
                statusItem.contentImportPolicy = contentImportPolicy;
            }
            if (!publishingError && !publishingErrorDetails)
                continue;
            if (statusItem) {
                statusItem.publishingError = publishingError;
                if (publishingErrorDetails) {
                    statusItem.publishingErrorDetails = publishingErrorDetails;
                }
            }
        }
        const workflowsToBeDeleted = (0, source_control_resource_helper_1.getDeletedResources)(statusResult, 'workflow');
        await this.sourceControlImportService.deleteWorkflowsNotInWorkfolder(user, workflowsToBeDeleted);
        const credentialsToBeDeleted = (0, source_control_resource_helper_1.getDeletedResources)(statusResult, 'credential');
        await this.sourceControlImportService.deleteCredentialsNotInWorkfolder(user, credentialsToBeDeleted);
        const tagsToBeImported = (0, source_control_resource_helper_1.getNonDeletedResources)(statusResult, 'tags')[0];
        if (tagsToBeImported) {
            await this.sourceControlImportService.importTagsFromWorkFolder(tagsToBeImported, user);
        }
        const tagsToBeDeleted = (0, source_control_resource_helper_1.getDeletedResources)(statusResult, 'tags');
        await this.sourceControlImportService.deleteTagsNotInWorkfolder(tagsToBeDeleted);
        const variablesToBeImported = (0, source_control_resource_helper_1.getNonDeletedResources)(statusResult, 'variables')[0];
        if (variablesToBeImported) {
            await this.sourceControlImportService.importVariablesFromWorkFolder(variablesToBeImported);
        }
        const variablesToBeDeleted = (0, source_control_resource_helper_1.getDeletedResources)(statusResult, 'variables');
        await this.sourceControlImportService.deleteVariablesNotInWorkfolder(variablesToBeDeleted);
        const dataTableCandidates = (0, source_control_resource_helper_1.getNonDeletedResources)(statusResult, 'datatable');
        if (dataTableCandidates.length > 0) {
            const dataTableImportResult = await this.sourceControlImportService.importDataTablesFromWorkFolder(dataTableCandidates, user.id);
            for (const failure of dataTableImportResult?.reconciliationFailures ?? []) {
                for (const item of statusResult) {
                    if (item.type === 'datatable' && item.id === failure.id) {
                        item.conflict = true;
                    }
                }
            }
        }
        const dataTablesToBeDeleted = (0, source_control_resource_helper_1.getDeletedResources)(statusResult, 'datatable');
        await this.sourceControlImportService.deleteDataTablesNotInWorkFolder(dataTablesToBeDeleted);
        const foldersToBeDeleted = (0, source_control_resource_helper_1.getDeletedResources)(statusResult, 'folders');
        await this.sourceControlImportService.deleteFoldersNotInWorkfolder(foldersToBeDeleted);
        const projectsToBeDeleted = (0, source_control_resource_helper_1.getDeletedResources)(statusResult, 'project');
        await this.sourceControlImportService.deleteTeamProjectsNotInWorkfolder(user, projectsToBeDeleted, credentialsToBeImported);
        this.eventService.emit('source-control-user-finished-pull-ui', (0, source_control_helper_ee_1.getTrackingInformationFromPullResult)(user.id, statusResult));
        return {
            statusCode: 200,
            statusResult,
        };
    }
    async getStatus(user, options) {
        return await this.workfolderMutex(async () => {
            await this.sanityCheck();
            const result = await this.sourceControlStatusService.getStatus(user, options);
            if (options.direction === 'pull') {
                const files = Array.isArray(result) ? result : result.sourceControlledFiles;
                await this.sourceControlImportService.previewContentImportPolicy(files, user.id);
            }
            return result;
        });
    }
    async getRemoteFileEntity({ user, type, id, commit = 'HEAD', }) {
        await this.sanityCheck();
        const context = await this.sourceControlContextFactory.createContext(user);
        switch (type) {
            case 'workflow': {
                if (typeof id === 'undefined') {
                    throw new errors_1.BadRequestError('Workflow ID is required to fetch workflow content');
                }
                const authorizedWorkflows = await this.sourceControlScopedService.getWorkflowsInAdminProjectsFromContext(context, id);
                if (authorizedWorkflows && authorizedWorkflows.length === 0) {
                    throw new errors_1.ForbiddenError(`You are not allowed to access workflow with id ${id}`);
                }
                const content = await this.gitService.getFileContent(`${constants_1.SOURCE_CONTROL_WORKFLOW_EXPORT_FOLDER}/${id}.json`, commit);
                return (0, n8n_workflow_1.jsonParse)(content);
            }
            default:
                throw new errors_1.BadRequestError(`Unsupported file type: ${type}`);
        }
    }
};
exports.SourceControlService = SourceControlService;
__decorate([
    (0, decorators_1.OnPubSubEvent)('reload-source-control-config', { instanceType: 'main' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SourceControlService.prototype, "reloadConfiguration", null);
exports.SourceControlService = SourceControlService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, source_control_git_service_ee_1.SourceControlGitService, source_control_preferences_service_ee_1.SourceControlPreferencesService, source_control_export_service_ee_1.SourceControlExportService, source_control_import_service_ee_1.SourceControlImportService, source_control_context_factory_1.SourceControlContextFactory, source_control_scoped_service_1.SourceControlScopedService, backend_services_1.EventService, source_control_status_service_ee_1.SourceControlStatusService])
], SourceControlService);
//# sourceMappingURL=source-control.service.ee.js.map