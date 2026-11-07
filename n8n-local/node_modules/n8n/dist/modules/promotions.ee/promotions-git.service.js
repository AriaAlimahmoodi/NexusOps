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
exports.PromotionsGitService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const promises_1 = require("node:fs/promises");
const node_os_1 = require("node:os");
const node_path_1 = __importDefault(require("node:path"));
const n8n_workflow_1 = require("n8n-workflow");
const p_limit_1 = __importDefault(require("p-limit"));
const simple_git_1 = require("simple-git");
const errors_1 = require("@n8n/errors");
const constants_1 = require("./constants");
const promotions_git_utils_1 = require("./promotions-git.utils");
const COMMIT_SHA = /^[0-9a-f]{40}([0-9a-f]{24})?$/;
const BASE_GIT_OPTIONS = {
    binary: 'git',
    maxConcurrentProcesses: 1,
    trimmed: false,
    timeout: { block: constants_1.GIT_COMMAND_STALL_TIMEOUT_MS },
    config: ['core.autocrlf=false'],
};
let PromotionsGitService = class PromotionsGitService {
    constructor(logger) {
        this.logger = logger;
        this.checkoutLocks = new Map();
        this.logger = this.logger.scoped('promotions');
    }
    async lockCheckout(repositoryFolder, operation) {
        let lock = this.checkoutLocks.get(repositoryFolder);
        if (!lock) {
            lock = (0, p_limit_1.default)(1);
            this.checkoutLocks.set(repositoryFolder, lock);
        }
        return await lock(operation);
    }
    validateRemoteUrl(remoteUrl, authType) {
        for (const char of remoteUrl) {
            const code = char.charCodeAt(0);
            if (code < 32 || code === 127) {
                throw new errors_1.BadRequestError('Remote URL must not contain control characters');
            }
        }
        if (authType === 'token') {
            this.validateHttpRemoteUrl(remoteUrl);
        }
        else {
            this.validateSshRemoteUrl(remoteUrl);
        }
    }
    validateHttpRemoteUrl(remoteUrl) {
        let url;
        try {
            url = new URL(remoteUrl);
        }
        catch {
            throw new errors_1.BadRequestError('Remote URL must be a valid HTTP or HTTPS URL');
        }
        if (!['http:', 'https:'].includes(url.protocol)) {
            throw new errors_1.BadRequestError('Username and password providers require an HTTP(S) remote URL');
        }
        if (url.username || url.password) {
            throw new errors_1.BadRequestError('Remote URL must not contain credentials');
        }
    }
    validateSshRemoteUrl(remoteUrl) {
        const error = new errors_1.BadRequestError('SSH key providers require an ssh:// or [user@]host:path remote URL');
        if (remoteUrl.startsWith('-') || remoteUrl.includes('::'))
            throw error;
        const scheme = /^([a-zA-Z][a-zA-Z0-9+.-]*):\/\//.exec(remoteUrl);
        if (scheme) {
            if (scheme[1].toLowerCase() !== 'ssh')
                throw error;
            let url;
            try {
                url = new URL(remoteUrl);
            }
            catch {
                throw error;
            }
            if (url.password)
                throw new errors_1.BadRequestError('Remote URL must not contain credentials');
            if (!url.hostname || !url.pathname || url.pathname === '/')
                throw error;
            return;
        }
        if (process.platform === 'win32' && /^[a-zA-Z]:/.test(remoteUrl))
            throw error;
        const isScpLike = /^(?:[a-zA-Z0-9_.-]+@)?[a-zA-Z0-9._][a-zA-Z0-9._-]*:[^\s]+$/.test(remoteUrl);
        if (!isScpLike)
            throw error;
    }
    async validateBranchName(branchName) {
        try {
            await (0, simple_git_1.simpleGit)().raw(['check-ref-format', '--branch', branchName]);
        }
        catch {
            throw new errors_1.BadRequestError(`Invalid Git branch name: ${branchName}`);
        }
    }
    async generateSshKeyPair(keyType) {
        return await (0, promotions_git_utils_1.generateSshKeyPair)(keyType, constants_1.PROMOTION_KEY_COMMENT);
    }
    async clone({ remoteUrl, credentials, paths, branchName, configId }) {
        await this.validateBranchName(branchName);
        await (0, promises_1.mkdir)(paths.rootFolder, { recursive: true });
        const { repositoryFolder, nextRepositoryFolder, sshDir } = paths;
        try {
            await this.lockCheckout(repositoryFolder, async () => {
                await (0, promises_1.rm)(nextRepositoryFolder, { recursive: true, force: true });
                try {
                    await this.withGit({ remoteUrl, credentials, repoDir: paths.rootFolder, sshDir }, async (git) => {
                        const branchRefs = await git.listRemote([
                            '--heads',
                            remoteUrl,
                            `refs/heads/${branchName}`,
                        ]);
                        if (!branchRefs.trim()) {
                            const anyRefs = await git.listRemote([remoteUrl]);
                            if (anyRefs.trim()) {
                                throw new errors_1.BadRequestError(`Remote branch does not exist: ${branchName}`);
                            }
                            await git.raw(['init', `--initial-branch=${branchName}`, nextRepositoryFolder]);
                            await (0, simple_git_1.simpleGit)({ ...BASE_GIT_OPTIONS, baseDir: nextRepositoryFolder }).addRemote('origin', remoteUrl);
                        }
                        else {
                            await git.clone(remoteUrl, nextRepositoryFolder, [
                                '--branch',
                                branchName,
                                '--single-branch',
                                '--no-tags',
                                '--progress',
                            ]);
                        }
                        await (0, promises_1.rm)(repositoryFolder, { recursive: true, force: true });
                        await (0, promises_1.rename)(nextRepositoryFolder, repositoryFolder);
                    });
                }
                catch (error) {
                    await (0, promises_1.rm)(nextRepositoryFolder, { recursive: true, force: true });
                    throw error;
                }
            });
        }
        catch (error) {
            throw this.mapGitError(error, { configId, branchName });
        }
    }
    async hasCheckout(repositoryFolder) {
        try {
            return await (0, simple_git_1.simpleGit)({
                baseDir: repositoryFolder,
                binary: 'git',
                maxConcurrentProcesses: 1,
            }).checkIsRepo(simple_git_1.CheckRepoActions.IS_REPO_ROOT);
        }
        catch {
            return false;
        }
    }
    async commitAndPush({ remoteUrl, credentials, paths, branchName, targetBranchName, configId, author, commitMessage, force, stagePathspec, onCheckoutRestored, rollbackOnFailure = false, }) {
        try {
            return await this.lockCheckout(paths.repositoryFolder, async () => await this.withGit({
                remoteUrl,
                credentials,
                repoDir: paths.repositoryFolder,
                sshDir: paths.sshDir,
                config: [`user.name=${author.name}`, `user.email=${author.email}`],
            }, async (git) => {
                if (targetBranchName) {
                    return await this.commitAndPushToTargetBranch(git, {
                        branchName,
                        targetBranchName,
                        commitMessage,
                        stagePathspec,
                        onCheckoutRestored,
                    });
                }
                const previousHead = rollbackOnFailure
                    ? (await git.raw([
                        'for-each-ref',
                        '--format=%(objectname)',
                        `refs/heads/${branchName}`,
                    ])).trim()
                    : undefined;
                try {
                    await git.add(['--all', '--', stagePathspec]);
                    await git.commit(commitMessage);
                    const commitSha = (await git.revparse(['HEAD'])).trim();
                    if (force) {
                        await git.push('origin', branchName, ['-f']);
                    }
                    else {
                        await git.push('origin', branchName);
                    }
                    return { commitSha };
                }
                catch (error) {
                    if (previousHead !== undefined) {
                        try {
                            if (previousHead) {
                                await git.raw(['reset', '--mixed', previousHead]);
                            }
                            else {
                                await git.raw(['update-ref', '-d', 'HEAD']);
                                await git.raw(['read-tree', '--empty']);
                            }
                        }
                        catch {
                            this.logger.warn('Failed to restore the Git revision after a failed promotion', {
                                configId,
                                branchName,
                            });
                        }
                    }
                    throw error;
                }
            }));
        }
        catch (error) {
            throw this.mapGitError(error, { configId, branchName: targetBranchName ?? branchName });
        }
    }
    async prepareCheckoutForPromotion(operation) {
        const { remoteUrl, credentials, paths, branchName, configId } = operation;
        try {
            await this.lockCheckout(paths.repositoryFolder, async () => {
                await this.withGit({ remoteUrl, credentials, repoDir: paths.repositoryFolder, sshDir: paths.sshDir }, async (git) => {
                    const branchRefs = await git.listRemote([
                        '--heads',
                        'origin',
                        `refs/heads/${branchName}`,
                    ]);
                    if (!branchRefs.trim()) {
                        throw new errors_1.BadRequestError(`Remote branch does not exist: ${branchName}`);
                    }
                    await git.fetch('origin', `+refs/heads/${branchName}:refs/remotes/origin/${branchName}`, ['--progress']);
                    await git.raw(['reset', '--hard', `origin/${branchName}`]);
                });
            });
        }
        catch (error) {
            throw this.mapGitError(error, { configId, branchName });
        }
    }
    async commitAndPushToTargetBranch(git, { branchName, targetBranchName, commitMessage, stagePathspec, onCheckoutRestored, }) {
        const preCommitHead = (await git.raw(['for-each-ref', '--format=%(objectname)', `refs/heads/${branchName}`])).trim();
        if (!preCommitHead) {
            throw new errors_1.BadRequestError(`Local branch does not exist: ${branchName}`);
        }
        try {
            await git.add(['--all', '--', stagePathspec]);
            await git.commit(commitMessage);
            const commitSha = (await git.revparse(['HEAD'])).trim();
            await git.push('origin', `HEAD:refs/heads/${targetBranchName}`);
            return { commitSha };
        }
        finally {
            await this.restorePromotionBase(git, {
                branchName,
                targetBranchName,
                preCommitHead,
                onCheckoutRestored,
            });
        }
    }
    async restorePromotionBase(git, { branchName, targetBranchName, preCommitHead, onCheckoutRestored, }) {
        try {
            await git.raw(['reset', '--hard', preCommitHead]);
        }
        catch {
            this.logger.warn('Failed to restore Git checkout after promotion', {
                branchName,
                targetBranchName,
            });
            return;
        }
        try {
            await onCheckoutRestored();
        }
        catch {
            this.logger.warn('Failed to trust the Git checkout after promotion', {
                branchName,
                targetBranchName,
            });
        }
    }
    async fetchBranch({ remoteUrl, credentials, paths, branchName, }) {
        await this.withGit({ remoteUrl, credentials, repoDir: paths.repositoryFolder, sshDir: paths.sshDir }, async (git) => {
            await git.fetch('origin', `+refs/heads/${branchName}:refs/remotes/origin/${branchName}`, [
                '--progress',
            ]);
        });
    }
    async refreshCheckout(operation) {
        const { paths, branchName, configId } = operation;
        try {
            return await this.lockCheckout(paths.repositoryFolder, async () => {
                await this.fetchBranch(operation);
                const git = (0, simple_git_1.simpleGit)({ ...BASE_GIT_OPTIONS, baseDir: paths.repositoryFolder });
                await git.raw(['reset', '--hard', `origin/${branchName}`]);
                return { commitSha: (await git.revparse(['HEAD'])).trim() };
            });
        }
        catch (error) {
            throw this.mapGitError(error, { configId, branchName });
        }
    }
    async listBranchTree({ pathspecs, ...operation }) {
        const { remoteUrl, credentials, paths, branchName, configId } = operation;
        try {
            return await this.lockCheckout(paths.repositoryFolder, async () => {
                const git = (0, simple_git_1.simpleGit)({ ...BASE_GIT_OPTIONS, baseDir: paths.repositoryFolder });
                try {
                    await this.fetchBranch(operation);
                }
                catch (error) {
                    const cached = await git.branch(['--remotes', '--list', `origin/${branchName}`]);
                    if (cached.all.length > 0)
                        throw error;
                    const refs = await this.withGit({ remoteUrl, credentials, repoDir: paths.repositoryFolder, sshDir: paths.sshDir }, async (git) => await git.listRemote(['origin']));
                    if (!refs.trim())
                        return { commitSha: null, lsTreeOutput: '' };
                    throw error;
                }
                const commitSha = (await git.revparse([`refs/remotes/origin/${branchName}`])).trim();
                const lsTreeOutput = await git.raw(['ls-tree', '-r', '-z', commitSha, '--', ...pathspecs]);
                return { commitSha, lsTreeOutput };
            });
        }
        catch (error) {
            throw this.mapGitError(error, { configId, branchName });
        }
    }
    async hasCommittedPath({ paths, branchName, configId, pathspec, }) {
        try {
            return await this.lockCheckout(paths.repositoryFolder, async () => {
                const git = (0, simple_git_1.simpleGit)({ ...BASE_GIT_OPTIONS, baseDir: paths.repositoryFolder });
                const head = (await git.raw(['for-each-ref', '--format=%(objectname)', `refs/heads/${branchName}`])).trim();
                if (!head)
                    return false;
                return (await git.raw(['ls-tree', head, '--', pathspec])).trim() !== '';
            });
        }
        catch (error) {
            throw this.mapGitError(error, { configId, branchName });
        }
    }
    async readFilesAtCommit({ paths, branchName, configId, commitSha, filePaths, }) {
        if (!COMMIT_SHA.test(commitSha)) {
            throw new n8n_workflow_1.UnexpectedError('The commit SHA is not a Git object name');
        }
        if (filePaths.length === 0)
            return new Map();
        try {
            return await this.lockCheckout(paths.repositoryFolder, async () => {
                const git = (0, simple_git_1.simpleGit)({
                    ...BASE_GIT_OPTIONS,
                    baseDir: paths.repositoryFolder,
                    maxConcurrentProcesses: constants_1.GIT_READ_CONCURRENCY,
                });
                const files = await Promise.all(filePaths.map(async (filePath) => [filePath, await git.show([`${commitSha}:${filePath}`])]));
                return new Map(files);
            });
        }
        catch (error) {
            throw this.mapGitError(error, { configId, branchName });
        }
    }
    async withGit({ remoteUrl, credentials, repoDir, sshDir, config: extraConfig = [], }, operation) {
        await (0, promises_1.mkdir)(repoDir, { recursive: true });
        const options = {
            ...BASE_GIT_OPTIONS,
            baseDir: repoDir,
            config: [...BASE_GIT_OPTIONS.config, ...extraConfig],
        };
        let temporaryFolder;
        try {
            let git;
            if (credentials.authType === 'token') {
                const config = [...options.config, ...(0, promotions_git_utils_1.buildHttpsGitConfig)({ repositoryUrl: remoteUrl })];
                git = (0, simple_git_1.simpleGit)({
                    ...options,
                    config,
                    unsafe: { allowUnsafeCredentialHelper: true },
                    allowEnvironment: ['GIT_TERMINAL_PROMPT'],
                })
                    .env('GIT_TERMINAL_PROMPT', '0')
                    .env('N8N_GIT_USERNAME', credentials.username)
                    .env('N8N_GIT_PASSWORD', credentials.password);
            }
            else {
                temporaryFolder = await (0, promises_1.mkdtemp)(node_path_1.default.join((0, node_os_1.tmpdir)(), 'n8n-promotions-'));
                const privateKeyPath = node_path_1.default.join(temporaryFolder, 'private-key');
                await (0, promises_1.writeFile)(privateKeyPath, credentials.privateKey, { mode: 0o600 });
                await (0, promises_1.chmod)(privateKeyPath, 0o600);
                await (0, promises_1.mkdir)(sshDir, { recursive: true });
                const sshCommand = (0, promotions_git_utils_1.buildSshCommand)({
                    privateKeyPath,
                    knownHostsPath: node_path_1.default.join(sshDir, 'known_hosts'),
                });
                git = (0, simple_git_1.simpleGit)({
                    ...options,
                    unsafe: { allowUnsafeSshCommand: true },
                    allowEnvironment: ['GIT_SSH_COMMAND', 'GIT_TERMINAL_PROMPT'],
                })
                    .env('GIT_SSH_COMMAND', sshCommand)
                    .env('GIT_TERMINAL_PROMPT', '0');
            }
            return await operation(git);
        }
        finally {
            if (temporaryFolder)
                await (0, promises_1.rm)(temporaryFolder, { recursive: true, force: true });
        }
    }
    mapGitError(error, ctx) {
        if (error instanceof errors_1.BadRequestError || error instanceof errors_1.ServiceUnavailableError)
            return error;
        if (error instanceof simple_git_1.GitPluginError && error.plugin === 'timeout') {
            this.logger.warn('Git operation stalled', ctx);
            return new errors_1.ServiceUnavailableError('The Git operation timed out. Please try again.');
        }
        this.logger.warn('Git operation failed', ctx);
        return new errors_1.BadRequestError('Could not complete the Git operation');
    }
};
exports.PromotionsGitService = PromotionsGitService;
exports.PromotionsGitService = PromotionsGitService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger])
], PromotionsGitService);
//# sourceMappingURL=promotions-git.service.js.map