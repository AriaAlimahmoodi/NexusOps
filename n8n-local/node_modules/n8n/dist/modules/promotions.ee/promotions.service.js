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
exports.PromotionsService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const promises_1 = require("node:fs/promises");
const node_path_1 = __importDefault(require("node:path"));
const n8n_workflow_1 = require("n8n-workflow");
const errors_1 = require("@n8n/errors");
const directory_package_reader_1 = require("../../modules/n8n-packages/io/directory/directory-package-reader");
const package_directory_inventory_reader_1 = require("../../modules/n8n-packages/io/directory/package-directory-inventory-reader");
const n8n_packages_config_1 = require("../../modules/n8n-packages/n8n-packages.config");
const n8n_packages_service_1 = require("../../modules/n8n-packages/n8n-packages.service");
const constants_1 = require("../../modules/n8n-packages/spec/constants");
const n8n_packages_types_1 = require("../../modules/n8n-packages/n8n-packages.types");
const project_service_ee_1 = require("../../services/project.service.ee");
const base_branch_files_1 = require("./base-branch-files");
const constants_2 = require("./constants");
const promotion_binding_preflight_service_1 = require("./promotion-binding-preflight.service");
const promotion_config_resolver_1 = require("./promotion-config.resolver");
const promotion_providers_service_1 = require("./promotion-providers.service");
const promotion_working_directory_service_1 = require("./promotion-working-directory.service");
const promotions_git_service_1 = require("./promotions-git.service");
const promotions_git_utils_1 = require("./promotions-git.utils");
const working_copy_updater_1 = require("./working-copy-updater");
function isConfirmableConflict(code) {
    return code === 'destructive-change' || code === 'project-deletion';
}
const IMPORT_POLICY = {
    projectConflictPolicy: n8n_packages_types_1.ProjectConflictPolicy.Overwrite,
    workflowConflictPolicy: n8n_packages_types_1.WorkflowConflictPolicy.NewVersion,
    workflowIdPolicy: n8n_packages_types_1.WorkflowIdPolicy.Source,
    workflowPublishingPolicy: n8n_packages_types_1.WorkflowPublishingPolicy.MatchSource,
    missingNodeTypeMode: n8n_packages_types_1.MissingNodeTypeMode.Fail,
    credentialMatchingMode: 'id-only',
    credentialMissingMode: 'must-preexist',
    credentialConflictPolicy: n8n_packages_types_1.CredentialConflictPolicy.KeepExisting,
    folderConflictPolicy: n8n_packages_types_1.FolderConflictPolicy.Overwrite,
    overwriteDeletionPolicy: n8n_packages_types_1.OverwriteDeletionPolicy.HardDelete,
    dataTableMatchingMode: 'by-id',
    dataTableMissingMode: n8n_packages_types_1.DataTableMissingMode.Create,
    dataTableSchemaConflictPolicy: n8n_packages_types_1.DataTableSchemaConflictPolicy.OverwriteNonDestructive,
    variableMissingMode: n8n_packages_types_1.VariableMissingMode.MustPreexist,
    variableConflictPolicy: n8n_packages_types_1.VariableConflictPolicy.KeepExisting,
    tagMissingMode: n8n_packages_types_1.TagMissingMode.Create,
    tagConflictPolicy: n8n_packages_types_1.TagConflictPolicy.Rename,
};
let PromotionsService = class PromotionsService {
    constructor(resolver, providersService, workingDirectory, workingCopy, gitService, projectRepository, sharedWorkflowRepository, projectService, n8nPackagesService, bindingPreflight, inventoryReader, packageImportConfig, logger) {
        this.resolver = resolver;
        this.providersService = providersService;
        this.workingDirectory = workingDirectory;
        this.workingCopy = workingCopy;
        this.gitService = gitService;
        this.projectRepository = projectRepository;
        this.sharedWorkflowRepository = sharedWorkflowRepository;
        this.projectService = projectService;
        this.n8nPackagesService = n8nPackagesService;
        this.bindingPreflight = bindingPreflight;
        this.inventoryReader = inventoryReader;
        this.packageImportConfig = packageImportConfig;
        this.logger = logger;
        this.logger = this.logger.scoped('promotions');
    }
    async clone(connectionId, direction) {
        const input = await this.resolver.resolveForConnection(connectionId, direction);
        const branchName = (0, promotions_git_utils_1.checkoutBranchName)(input.config);
        await this.gitService.clone({
            remoteUrl: (0, promotions_git_utils_1.repositoryUrl)(input),
            credentials: await this.credentialsFor(input),
            paths: this.workingDirectory.paths(input.configId),
            branchName,
            configId: input.configId,
        });
        await this.workingDirectory.writeDescriptor(this.descriptorFor(input));
        return { ...this.checkoutIdentity(input), branchName, hasCheckout: true };
    }
    async disconnect(connectionId, direction) {
        const input = await this.resolver.resolveForConnection(connectionId, direction);
        await this.workingDirectory.resetCheckout(input.configId);
        return {
            ...this.checkoutIdentity(input),
            branchName: (0, promotions_git_utils_1.checkoutBranchName)(input.config),
            hasCheckout: false,
        };
    }
    async promote(connectionId, actor, request) {
        const input = await this.resolver.resolveForConnection(connectionId, 'promote');
        if (input.config.direction !== 'promote') {
            throw new n8n_workflow_1.UnexpectedError('Resolved an invalid promotion direction');
        }
        this.assertInstanceScope(input, 'Promote');
        await this.assertCheckoutReady(input, 'promoting');
        const branchName = (0, promotions_git_utils_1.checkoutBranchName)(input.config);
        const credentials = await this.credentialsFor(input);
        const targetBranchName = await this.prepareTargetBranch(input, branchName, credentials);
        const { repositoryFolder } = this.workingDirectory.paths(input.configId);
        const packageFolder = node_path_1.default.join(repositoryFolder, constants_2.PACKAGE_SUBFOLDER);
        const projectIds = await this.projectRepository.findTeamProjectIds();
        this.logger.info('Exporting projects for a promotion', {
            connectionId,
            configId: input.configId,
            projectCount: projectIds.length,
        });
        await (0, promises_1.mkdir)(repositoryFolder, { recursive: true });
        const stagingFolder = await (0, promises_1.mkdtemp)(node_path_1.default.join(repositoryFolder, `.${constants_2.PACKAGE_SUBFOLDER}-`));
        try {
            const exportResult = await this.n8nPackagesService.exportPackageToDirectory({
                user: actor,
                projectIds,
                includeAgents: false,
                includeVariableValues: true,
                canExportVariableValues: request.canExportVariableValues,
                includeTags: true,
                includeArchivedWorkflows: true,
                dependencyPolicy: n8n_packages_types_1.ExportDependencyPolicy.Fail,
                versionPolicy: n8n_packages_types_1.ExportVersionPolicy.Latest,
            }, { targetDir: stagingFolder });
            await (0, promises_1.rm)(packageFolder, { recursive: true, force: true });
            await (0, promises_1.rename)(stagingFolder, packageFolder);
            if (targetBranchName) {
                await this.workingDirectory.invalidateDescriptor(input.configId);
            }
            const { commitSha } = await this.gitService.commitAndPush({
                remoteUrl: (0, promotions_git_utils_1.repositoryUrl)(input),
                credentials,
                paths: this.workingDirectory.paths(input.configId),
                branchName,
                targetBranchName,
                configId: input.configId,
                author: this.commitAuthor(actor),
                commitMessage: request.commitMessage,
                force: targetBranchName ? false : (request.force ?? false),
                stagePathspec: constants_2.PACKAGE_SUBFOLDER,
                onCheckoutRestored: async () => await this.workingDirectory.writeDescriptor(this.descriptorFor(input)),
            });
            return {
                connectionId: input.connectionId,
                configId: input.configId,
                counts: exportResult.counts,
                git: { commitSha, branchName: targetBranchName ?? branchName },
            };
        }
        finally {
            await (0, promises_1.rm)(stagingFolder, { recursive: true, force: true });
        }
    }
    async promoteSelectionResolved(input, actor, request, selection) {
        this.assertInstanceScope(input, 'Promote');
        this.workingCopy.validateSelection(selection);
        await this.assertTeamProject(selection.projectId);
        await this.assertCheckoutReady(input, 'promoting');
        const branchName = (0, promotions_git_utils_1.checkoutBranchName)(input.config);
        const credentials = await this.credentialsFor(input);
        const targetBranchName = await this.prepareTargetBranch(input, branchName, credentials);
        const { repositoryFolder } = this.workingDirectory.paths(input.configId);
        const packageFolder = node_path_1.default.join(repositoryFolder, constants_2.PACKAGE_SUBFOLDER);
        const packageExisted = await pathExists(packageFolder);
        if (!(await pathExists(node_path_1.default.join(packageFolder, constants_1.MANIFEST_FILE))) &&
            (await this.gitService.hasCommittedPath({
                paths: this.workingDirectory.paths(input.configId),
                branchName,
                configId: input.configId,
                pathspec: `${constants_2.PACKAGE_SUBFOLDER}/${constants_1.MANIFEST_FILE}`,
            }))) {
            throw new errors_1.BadRequestError('The local copy of the promote branch is incomplete. Disconnect and connect it again in the instance connection settings.');
        }
        const branch = await this.workingCopy.assertSelectionFitsBranch(packageFolder, selection);
        const stagingFolder = await (0, promises_1.mkdtemp)(node_path_1.default.join(repositoryFolder, `.${constants_2.PACKAGE_SUBFOLDER}-`));
        const prePushBackup = `${packageFolder}.pre-selection`;
        let backedUp = false;
        let keepPrePushBackup = false;
        try {
            if (packageExisted) {
                await (0, promises_1.rm)(prePushBackup, { recursive: true, force: true });
                await (0, promises_1.cp)(packageFolder, prePushBackup, { recursive: true, verbatimSymlinks: true });
                backedUp = true;
            }
            const { manifest: staging, counts } = await this.n8nPackagesService.exportPackageToDirectory({
                user: actor,
                projectIds: [selection.projectId],
                projectWorkflowIds: selection.workflowIds,
                includeVariableValues: true,
                canExportVariableValues: request.canExportVariableValues,
                includeTags: true,
                includeArchivedWorkflows: true,
                dependencyPolicy: n8n_packages_types_1.ExportDependencyPolicy.ReferenceOnly,
                versionPolicy: n8n_packages_types_1.ExportVersionPolicy.Latest,
            }, { targetDir: stagingFolder });
            await this.workingCopy.applySelection(packageFolder, stagingFolder, staging, selection, branch);
            if (targetBranchName) {
                await this.workingDirectory.invalidateDescriptor(input.configId);
            }
            const { commitSha } = await this.gitService.commitAndPush({
                remoteUrl: (0, promotions_git_utils_1.repositoryUrl)(input),
                credentials,
                paths: this.workingDirectory.paths(input.configId),
                branchName,
                targetBranchName,
                configId: input.configId,
                author: this.commitAuthor(actor),
                commitMessage: request.commitMessage,
                force: false,
                stagePathspec: constants_2.PACKAGE_SUBFOLDER,
                rollbackOnFailure: true,
                onCheckoutRestored: async () => await this.workingDirectory.writeDescriptor(this.descriptorFor(input)),
            });
            return {
                connectionId: input.connectionId,
                configId: input.configId,
                counts,
                git: { commitSha, branchName: targetBranchName ?? branchName },
            };
        }
        catch (error) {
            if (backedUp) {
                await (0, promises_1.rm)(packageFolder, { recursive: true, force: true }).catch((restoreError) => {
                    this.logger.warn('Failed to remove the incomplete selection after a failed promote', {
                        packageFolder,
                        error: restoreError,
                    });
                });
                try {
                    await (0, promises_1.rename)(prePushBackup, packageFolder);
                }
                catch (restoreError) {
                    keepPrePushBackup = true;
                    this.logger.warn('Failed to restore the package from the pre-selection copy. The copy is at the backup path.', { packageFolder, backupFolder: prePushBackup, error: restoreError });
                }
            }
            else if (!packageExisted) {
                await (0, promises_1.rm)(packageFolder, { recursive: true, force: true }).catch((cleanupError) => {
                    this.logger.warn('Failed to remove the first selection after a failed promote', {
                        packageFolder,
                        error: cleanupError,
                    });
                });
            }
            throw error;
        }
        finally {
            if (packageExisted && !keepPrePushBackup) {
                await (0, promises_1.rm)(prePushBackup, { recursive: true, force: true }).catch((error) => {
                    this.logger.warn('Failed to remove the selection backup', { prePushBackup, error });
                });
            }
            await (0, promises_1.rm)(stagingFolder, { recursive: true, force: true }).catch((error) => {
                this.logger.warn('Failed to remove the selection staging folder', { stagingFolder, error });
            });
        }
    }
    async promoteProjectSelection(projectId, actor, request) {
        if (new Set(request.workflowIds).size !== request.workflowIds.length) {
            throw new errors_1.BadRequestError('workflowIds contains duplicates');
        }
        const input = await this.resolver.resolveForProject(projectId, 'promote');
        const selection = await this.classifySelection(projectId, request.workflowIds);
        return await this.promoteSelectionResolved(input, actor, {
            commitMessage: request.commitMessage ?? constants_2.PROMOTE_SELECTION_COMMIT_MESSAGE,
            canExportVariableValues: request.canExportVariableValues,
        }, selection);
    }
    async classifySelection(projectId, workflowIds) {
        const ownerProjects = await this.sharedWorkflowRepository.findOwnerProjectsByWorkflowIds(workflowIds);
        const live = [];
        const deleted = [];
        for (const id of workflowIds) {
            if (ownerProjects.get(id)?.id !== projectId) {
                deleted.push(id);
                continue;
            }
            live.push(id);
        }
        return { projectId, workflowIds: live, deletedWorkflowIds: deleted };
    }
    async apply(connectionId, actor, expectedSource) {
        return await this.applyFromSource(connectionId, actor, expectedSource);
    }
    async continueApply(connectionId, actor, request) {
        return await this.applyFromSource(connectionId, actor, request.expectedSource, request.confirmDestructiveChanges === true);
    }
    async applyProjectSelection(projectId, actor, request) {
        return await this.applySelectionFromSource(projectId, actor, request.workflowIds, request.expectedSource);
    }
    async continueApplyProjectSelection(projectId, actor, request) {
        return await this.applySelectionFromSource(projectId, actor, request.workflowIds, request.expectedSource, request.confirmDestructiveChanges === true);
    }
    async classifyApplySelection(inventory, projectId, workflowIds) {
        const branchWorkflowIds = new Set(inventory.workflows
            .filter((workflow) => workflow.projectId === projectId)
            .map(({ id }) => id));
        const packageWorkflowIds = new Set(inventory.workflows.map(({ id }) => id));
        const ownerProjects = await this.sharedWorkflowRepository.findOwnerProjectsByWorkflowIds(workflowIds);
        const selectedWorkflowIds = [];
        const deletedWorkflowIds = [];
        const movedWorkflowIds = [];
        const invalidWorkflowIds = [];
        for (const id of workflowIds) {
            if (branchWorkflowIds.has(id)) {
                selectedWorkflowIds.push(id);
            }
            else if (ownerProjects.get(id)?.id === projectId) {
                if (packageWorkflowIds.has(id)) {
                    movedWorkflowIds.push(id);
                }
                else {
                    deletedWorkflowIds.push(id);
                }
            }
            else {
                invalidWorkflowIds.push(id);
            }
        }
        if (invalidWorkflowIds.length > 0) {
            throw new errors_1.BadRequestError(`The following workflows are not in this project's branch or instance: ${invalidWorkflowIds.join(', ')}`);
        }
        if (movedWorkflowIds.length > 0) {
            throw new errors_1.ConflictError(`These workflows moved to another project: ${movedWorkflowIds.join(', ')}. A selective apply cannot move them. Apply all projects instead.`);
        }
        return { selectedProjectId: projectId, selectedWorkflowIds, deletedWorkflowIds };
    }
    async applySelectionFromSource(projectId, actor, workflowIds, expectedSource, confirmDestructiveChanges = false) {
        const input = await this.resolver.resolveForProject(projectId, 'apply');
        await this.assertCheckoutReady(input, 'applying');
        const branchName = (0, promotions_git_utils_1.checkoutBranchName)(input.config);
        const paths = this.workingDirectory.paths(input.configId);
        const { commitSha } = await this.gitService.refreshCheckout({
            remoteUrl: (0, promotions_git_utils_1.repositoryUrl)(input),
            credentials: await this.credentialsFor(input),
            paths,
            branchName,
            configId: input.configId,
        });
        const identity = {
            connectionId: input.connectionId,
            configId: input.configId,
            git: { commitSha, branchName },
        };
        if (expectedSource &&
            (expectedSource.configId !== input.configId ||
                expectedSource.branchName !== branchName ||
                expectedSource.commitSha !== commitSha)) {
            this.logger.info('Apply stopped because the source changed', {
                status: 'source-changed',
                ...identity,
            });
            return { status: 'source-changed', ...identity };
        }
        const packageFolder = node_path_1.default.join(paths.repositoryFolder, constants_2.PACKAGE_SUBFOLDER);
        if (!(await isDirectory(packageFolder))) {
            throw new errors_1.BadRequestError('The remote branch has no exported package to import. Promote to it first.');
        }
        const reader = new directory_package_reader_1.DirectoryPackageReader(packageFolder, this.packageImportConfig);
        const inventory = await this.inventoryReader.read(reader);
        const selection = await this.classifyApplySelection(inventory, projectId, workflowIds);
        const preflight = await this.bindingPreflight.checkInventory({
            inventory,
            selection: {
                selectedProjectId: projectId,
                selectedWorkflowIds: selection.selectedWorkflowIds,
            },
        });
        const blockingConflicts = confirmDestructiveChanges
            ? preflight.conflicts.filter(({ code }) => !isConfirmableConflict(code))
            : preflight.conflicts;
        if (preflight.missingBindings.length > 0 ||
            preflight.accessRequirements.length > 0 ||
            blockingConflicts.length > 0) {
            this.logger.info('Apply blocked by unresolved bindings', {
                status: 'blocked',
                ...identity,
                bindingCounts: {
                    missingBindings: preflight.missingBindings.length,
                    accessRequirements: preflight.accessRequirements.length,
                    conflicts: preflight.conflicts.length,
                    warnings: preflight.warnings.length,
                },
            });
            return { status: 'blocked', ...identity, preflight };
        }
        this.logger.info('Importing a package selection', {
            ...identity,
            projectId,
            selectedCount: selection.selectedWorkflowIds.length,
            deletedCount: selection.deletedWorkflowIds?.length ?? 0,
            confirmDestructiveChanges,
        });
        const result = await this.n8nPackagesService.importPackageSelectionFromDirectory({
            user: actor,
            overwriteDeletionPolicy: n8n_packages_types_1.OverwriteDeletionPolicy.HardDelete,
            dataTableSchemaConflictPolicy: confirmDestructiveChanges
                ? n8n_packages_types_1.DataTableSchemaConflictPolicy.Overwrite
                : IMPORT_POLICY.dataTableSchemaConflictPolicy,
        }, { sourceDir: packageFolder }, selection);
        return {
            status: 'applied',
            ...identity,
            counts: this.toApplyCounts({
                importResult: result,
                projectReconciliation: { deletedProjectIds: [] },
            }),
            warnings: preflight.warnings,
        };
    }
    async applyFromSource(connectionId, actor, expectedSource, confirmDestructiveChanges = false) {
        const input = await this.resolver.resolveForConnection(connectionId, 'apply');
        this.assertInstanceScope(input, 'Apply');
        await this.assertCheckoutReady(input, 'applying');
        const branchName = (0, promotions_git_utils_1.checkoutBranchName)(input.config);
        const paths = this.workingDirectory.paths(input.configId);
        const { commitSha } = await this.gitService.refreshCheckout({
            remoteUrl: (0, promotions_git_utils_1.repositoryUrl)(input),
            credentials: await this.credentialsFor(input),
            paths,
            branchName,
            configId: input.configId,
        });
        const identity = {
            connectionId: input.connectionId,
            configId: input.configId,
            git: { commitSha, branchName },
        };
        if (expectedSource &&
            (expectedSource.configId !== input.configId ||
                expectedSource.branchName !== branchName ||
                expectedSource.commitSha !== commitSha)) {
            this.logger.info('Apply stopped because the source changed', {
                status: 'source-changed',
                ...identity,
            });
            return { status: 'source-changed', ...identity };
        }
        const packageFolder = node_path_1.default.join(paths.repositoryFolder, constants_2.PACKAGE_SUBFOLDER);
        if (!(await isDirectory(packageFolder))) {
            throw new errors_1.BadRequestError('The remote branch has no exported package to import. Promote to it first.');
        }
        const preflight = await this.bindingPreflight.checkDirectory({
            sourceDir: packageFolder,
        });
        const blockingConflicts = confirmDestructiveChanges
            ? preflight.conflicts.filter(({ code }) => !isConfirmableConflict(code))
            : preflight.conflicts;
        if (preflight.missingBindings.length > 0 ||
            preflight.accessRequirements.length > 0 ||
            blockingConflicts.length > 0) {
            this.logger.info('Apply blocked by unresolved bindings', {
                status: 'blocked',
                ...identity,
                bindingCounts: {
                    missingBindings: preflight.missingBindings.length,
                    accessRequirements: preflight.accessRequirements.length,
                    conflicts: preflight.conflicts.length,
                    warnings: preflight.warnings.length,
                },
            });
            return { status: 'blocked', ...identity, preflight };
        }
        this.logger.info('Importing a package', {
            connectionId,
            configId: input.configId,
            confirmDestructiveChanges,
        });
        const result = await this.n8nPackagesService.importPackageFromDirectory({
            user: actor,
            ...IMPORT_POLICY,
            dataTableSchemaConflictPolicy: confirmDestructiveChanges
                ? n8n_packages_types_1.DataTableSchemaConflictPolicy.Overwrite
                : IMPORT_POLICY.dataTableSchemaConflictPolicy,
        }, { sourceDir: packageFolder });
        const importedProjectIds = result.projects.map((project) => project.localId);
        const confirmedProjectIds = preflight.conflicts.flatMap((conflict) => conflict.code === 'project-deletion' ? conflict.project.id : []);
        const projectReconciliation = await this.reconcileTeamProjects(actor, importedProjectIds, confirmedProjectIds);
        return {
            status: 'applied',
            ...identity,
            counts: this.toApplyCounts({ importResult: result, projectReconciliation }),
            warnings: preflight.warnings,
        };
    }
    async readBranchPackage(projectId, direction) {
        const input = await this.resolver.resolveForProject(projectId, direction);
        await this.assertCheckoutReady(input, 'listing branch files');
        const paths = this.workingDirectory.paths(input.configId);
        const branchName = (0, promotions_git_utils_1.checkoutBranchName)(input.config);
        const { commitSha, lsTreeOutput } = await this.gitService.listBranchTree({
            remoteUrl: (0, promotions_git_utils_1.repositoryUrl)(input),
            credentials: await this.credentialsFor(input),
            paths,
            branchName,
            configId: input.configId,
            pathspecs: base_branch_files_1.BASE_BRANCH_DIRECTORIES.map((directory) => `${constants_2.PACKAGE_SUBFOLDER}/${directory}/`),
        });
        return {
            configId: input.configId,
            branchName,
            commitSha,
            files: (0, base_branch_files_1.parseBaseBranchFiles)(lsTreeOutput, { exportRoot: constants_2.PACKAGE_SUBFOLDER, projectId }),
            readFiles: async (filePaths) => {
                if (commitSha === null) {
                    throw new errors_1.BadRequestError('The remote branch has no exported package to import. Promote to it first.');
                }
                return await this.gitService.readFilesAtCommit({
                    paths,
                    branchName,
                    configId: input.configId,
                    commitSha,
                    filePaths,
                });
            },
        };
    }
    async prepareTargetBranch(input, branchName, credentials) {
        if (input.config.direction !== 'promote' || !input.config.settings.createBranchOnPromotion) {
            return undefined;
        }
        const targetBranchName = (0, promotions_git_utils_1.buildPromotionBranchName)(new Date());
        await this.gitService.validateBranchName(targetBranchName);
        await this.gitService.prepareCheckoutForPromotion({
            remoteUrl: (0, promotions_git_utils_1.repositoryUrl)(input),
            credentials,
            paths: this.workingDirectory.paths(input.configId),
            branchName,
            configId: input.configId,
        });
        return targetBranchName;
    }
    assertInstanceScope(input, operation) {
        if (input.connectionScope !== 'instance') {
            throw new errors_1.BadRequestError(`${operation} is only available on the instance connection. Project connections are not supported yet.`);
        }
    }
    async assertTeamProject(projectId) {
        const project = await this.projectRepository.findOneBy({ id: projectId });
        if (!project)
            throw new errors_1.NotFoundError('Project not found');
        if (project.type !== 'team') {
            throw new errors_1.BadRequestError('Only team projects can use a promotion connection');
        }
    }
    async assertCheckoutReady(input, gerund) {
        const { repositoryFolder } = this.workingDirectory.paths(input.configId);
        const cloned = await this.gitService.hasCheckout(repositoryFolder);
        const current = cloned && (await this.workingDirectory.matchesDescriptor(this.descriptorFor(input)));
        if (!current) {
            throw new errors_1.BadRequestError(`This ${input.config.direction} configuration is not cloned. Clone it before ${gerund}.`);
        }
    }
    descriptorFor(input) {
        return (0, promotions_git_utils_1.buildCacheDescriptor)({
            connectionId: input.connectionId,
            configId: input.configId,
            target: input.target,
            config: input.config,
        });
    }
    checkoutIdentity(input) {
        return {
            connectionId: input.connectionId,
            configId: input.configId,
            direction: input.config.direction,
        };
    }
    async credentialsFor(input) {
        return await this.providersService.decryptCredentials({
            authType: input.authType,
            auth: input.encryptedAuth,
        });
    }
    async reconcileTeamProjects(actor, importedProjectIds, confirmedProjectIds) {
        const imported = new Set(importedProjectIds);
        const confirmed = new Set(confirmedProjectIds);
        const teamProjectIds = await this.projectRepository.findTeamProjectIds();
        const removedProjectIds = teamProjectIds.filter((projectId) => confirmed.has(projectId) && !imported.has(projectId));
        for (const projectId of removedProjectIds) {
            await this.projectService.deleteProject(actor, projectId);
        }
        return { deletedProjectIds: removedProjectIds };
    }
    commitAuthor(user) {
        const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || constants_2.GIT_DEFAULT_COMMIT_NAME;
        return { name, email: user.email ?? constants_2.GIT_DEFAULT_COMMIT_EMAIL };
    }
    toApplyCounts({ importResult, projectReconciliation, }) {
        const tally = (rows, statuses) => {
            const counts = Object.fromEntries(statuses.map((status) => [status, 0]));
            for (const { status } of rows)
                counts[status] += 1;
            return counts;
        };
        return {
            projects: {
                ...tally(importResult.projects, ['created', 'updated', 'skipped']),
                deleted: projectReconciliation.deletedProjectIds.length,
            },
            folders: {
                ...tally(importResult.folders, ['created', 'skipped']),
                removed: importResult.removedFolders.length,
            },
            workflows: {
                ...tally(importResult.workflows, ['created', 'updated', 'skipped']),
                archived: importResult.removedWorkflows.filter(({ deletion }) => deletion === 'archived')
                    .length,
                deleted: importResult.removedWorkflows.filter(({ deletion }) => deletion === 'deleted')
                    .length,
                publishing: tally(importResult.workflows.map(({ publishing }) => ({ status: publishing.state })), ['published', 'unpublished', 'unchanged', 'blocked', 'failed']),
            },
            credentials: {
                matched: importResult.credentials.matched.length,
                stubbed: importResult.credentials.stubbed.length,
            },
            dataTables: {
                matched: importResult.dataTables.matched,
                created: importResult.dataTables.created,
                updated: importResult.dataTables.updated,
            },
            variables: {
                matched: importResult.variables.matched.length,
                created: importResult.variables.created.length,
                updated: importResult.variables.updated.length,
                stubbed: importResult.variables.stubbed.length,
                missing: importResult.variables.missing.length,
            },
            tags: {
                matched: importResult.tags.matched.length,
                created: importResult.tags.created.length,
                renamed: importResult.tags.renamed.length,
                reconciled: importResult.tags.reconciled.length,
                skipped: importResult.tags.skipped.length,
            },
        };
    }
};
exports.PromotionsService = PromotionsService;
exports.PromotionsService = PromotionsService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [promotion_config_resolver_1.PromotionConfigResolver, promotion_providers_service_1.PromotionProvidersService, promotion_working_directory_service_1.PromotionWorkingDirectoryService, working_copy_updater_1.WorkingCopyUpdater, promotions_git_service_1.PromotionsGitService, db_1.ProjectRepository, db_1.SharedWorkflowRepository, project_service_ee_1.ProjectService, n8n_packages_service_1.N8nPackagesService, promotion_binding_preflight_service_1.PromotionBindingPreflightService, package_directory_inventory_reader_1.PackageDirectoryInventoryReader, n8n_packages_config_1.PackageImportConfig, backend_common_1.Logger])
], PromotionsService);
async function pathExists(target) {
    try {
        await (0, promises_1.stat)(target);
        return true;
    }
    catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT')
            return false;
        throw error;
    }
}
async function isDirectory(folder) {
    try {
        return (await (0, promises_1.stat)(folder)).isDirectory();
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=promotions.service.js.map