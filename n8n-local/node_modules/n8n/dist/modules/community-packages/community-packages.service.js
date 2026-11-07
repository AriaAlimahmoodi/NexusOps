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
exports.CommunityPackagesService = void 0;
exports.isValidVersionSpecifier = isValidVersionSpecifier;
const backend_common_1 = require("@n8n/backend-common");
const backend_network_1 = require("@n8n/backend-network");
const constants_1 = require("@n8n/constants");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const n8n_workflow_1 = require("n8n-workflow");
const node_child_process_1 = require("node:child_process");
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
const node_util_1 = require("node:util");
const p_limit_1 = __importDefault(require("p-limit"));
const semver_1 = require("semver");
const constants_2 = require("../../constants");
const feature_not_licensed_error_1 = require("../../errors/feature-not-licensed.error");
const incompatible_nodes_api_version_error_1 = require("../../errors/response-errors/incompatible-nodes-api-version.error");
const license_1 = require("../../license");
const load_nodes_and_credentials_1 = require("../../load-nodes-and-credentials");
const publisher_service_1 = require("../../scaling/pubsub/publisher.service");
const utils_1 = require("../../utils");
const community_node_types_utils_1 = require("./community-node-types-utils");
const community_packages_config_1 = require("./community-packages.config");
const installed_packages_repository_1 = require("./installed-packages.repository");
const npm_utils_1 = require("./npm-utils");
const asyncExecFile = (0, node_util_1.promisify)(node_child_process_1.execFile);
const NPM_DIST_TAG_PATTERN = /^[a-z][a-z0-9-._]*$/;
function isValidVersionSpecifier(version) {
    return (0, semver_1.valid)(version) !== null || NPM_DIST_TAG_PATTERN.test(version);
}
const DEFAULT_REGISTRY = 'https://registry.npmjs.org';
const REQUEST_TIMEOUT_MS = 30 * constants_1.Time.seconds.toMilliseconds;
const { PACKAGE_NAME_NOT_PROVIDED } = constants_2.RESPONSE_ERROR_MESSAGES;
const INVALID_OR_SUSPICIOUS_PACKAGE_NAME = /[^0-9a-z@\-._/]/;
const RESERVED_PACKAGE_NAMES = new Set(constants_1.BUILTIN_NODES_PACKAGES);
const NPM_PACKAGE_SCOPE_PATTERN = /^@[a-z0-9][a-z0-9\-._]*$/;
const NPM_PACKAGE_NAME_PATTERN = /^[a-z0-9][a-z0-9\-._]*$/;
let CommunityPackagesService = class CommunityPackagesService {
    constructor(instanceSettings, logger, installedPackageRepository, loadNodesAndCredentials, publisher, license, config, outboundHttp) {
        this.instanceSettings = instanceSettings;
        this.logger = logger;
        this.installedPackageRepository = installedPackageRepository;
        this.loadNodesAndCredentials = loadNodesAndCredentials;
        this.publisher = publisher;
        this.license = license;
        this.config = config;
        this.downloadFolder = this.instanceSettings.nodesDownloadDir;
        this.packageJsonPath = (0, node_path_1.join)(this.downloadFolder, 'package.json');
        this.packageMutex = (0, p_limit_1.default)(1);
        this.http = outboundHttp.requests({
            useDefaultSsrfPolicy: 'unsafe',
            timeout: REQUEST_TIMEOUT_MS,
        });
    }
    async init() {
        await this.ensurePackageJson();
        await this.checkForMissingPackages();
    }
    async findInstalledPackage(packageName) {
        return await this.installedPackageRepository.findOne({
            where: { packageName },
            relations: ['installedNodes'],
        });
    }
    async getAllInstalledPackages() {
        return await this.installedPackageRepository.find({ relations: ['installedNodes'] });
    }
    async removePackageFromDatabase(packageName) {
        return await this.installedPackageRepository.remove(packageName);
    }
    async persistInstalledPackage(packageLoader) {
        try {
            return await this.installedPackageRepository.saveInstalledPackageWithNodes(packageLoader);
        }
        catch (maybeError) {
            const error = (0, utils_1.toError)(maybeError);
            this.logger.error('Failed to save installed packages and nodes', {
                error,
                packageName: packageLoader.packageJson.name,
            });
            throw error;
        }
    }
    async replaceInstalledPackage(previousInstalledPackage, packageLoader) {
        try {
            return await this.installedPackageRepository.replaceInstalledPackageWithNodes(previousInstalledPackage, packageLoader);
        }
        catch (maybeError) {
            const error = (0, utils_1.toError)(maybeError);
            this.logger.error('Failed to replace installed package and nodes', {
                error,
                packageName: packageLoader.packageJson.name,
            });
            throw error;
        }
    }
    parseNpmPackageName(rawString) {
        if (!rawString)
            throw new n8n_workflow_1.UnexpectedError(PACKAGE_NAME_NOT_PROVIDED);
        if (INVALID_OR_SUSPICIOUS_PACKAGE_NAME.test(rawString)) {
            throw new n8n_workflow_1.UnexpectedError('Package name must be a single word');
        }
        const scope = rawString.includes('/') ? rawString.split('/')[0] : undefined;
        if (scope && !NPM_PACKAGE_SCOPE_PATTERN.test(scope)) {
            throw new n8n_workflow_1.UnexpectedError(`Invalid package scope: ${scope}`);
        }
        const packageNameWithoutScope = scope ? rawString.replace(`${scope}/`, '') : rawString;
        if (!packageNameWithoutScope.startsWith(constants_2.NODE_PACKAGE_PREFIX)) {
            throw new n8n_workflow_1.UnexpectedError(`Package name must start with ${constants_2.NODE_PACKAGE_PREFIX}`);
        }
        const version = packageNameWithoutScope.includes('@')
            ? packageNameWithoutScope.split('@')[1]
            : undefined;
        if (version && !isValidVersionSpecifier(version)) {
            throw new n8n_workflow_1.UnexpectedError(`Invalid version: ${version}`);
        }
        const packageName = version ? rawString.replace(`@${version}`, '') : rawString;
        const nameWithoutScopeOrVersion = scope ? packageName.replace(`${scope}/`, '') : packageName;
        if (!NPM_PACKAGE_NAME_PATTERN.test(nameWithoutScopeOrVersion)) {
            throw new n8n_workflow_1.UnexpectedError(`Invalid package name: ${packageName}`);
        }
        if (RESERVED_PACKAGE_NAMES.has(packageName)) {
            throw new n8n_workflow_1.UserError(`Package name "${packageName}" is reserved for n8n built-in packages`);
        }
        return { packageName, scope, version, rawString };
    }
    matchPackagesWithUpdates(packages, updates) {
        if (!updates)
            return packages;
        return packages.reduce((acc, cur) => {
            const publicPackage = { ...cur };
            const update = updates[cur.packageName];
            if (update)
                publicPackage.updateAvailable = update.latest;
            acc.push(publicPackage);
            return acc;
        }, []);
    }
    areNodesLoaded(installedNodes) {
        return (installedNodes.length === 0 ||
            installedNodes.some((node) => this.loadNodesAndCredentials.isKnownNode(node.type)));
    }
    withLoadStatus(installedPackages) {
        return installedPackages.map((installedPackage) => ({
            ...installedPackage,
            failedLoading: !this.areNodesLoaded(installedPackage.installedNodes),
        }));
    }
    async checkNpmPackageStatus(packageName) {
        const N8N_BACKEND_SERVICE_URL = 'https://api.n8n.io/api/package';
        try {
            const response = await this.http.request({
                url: N8N_BACKEND_SERVICE_URL,
                method: 'POST',
                body: { name: packageName },
                json: true,
            });
            if (response.status !== constants_2.NPM_PACKAGE_STATUS_GOOD)
                return response;
        }
        catch {
        }
        return { status: constants_2.NPM_PACKAGE_STATUS_GOOD };
    }
    isPackageLoaded(installedPackage) {
        return this.areNodesLoaded(installedPackage.installedNodes);
    }
    async readPackageJson() {
        const content = await (0, promises_1.readFile)(this.packageJsonPath, 'utf-8').catch(() => null);
        if (content === null)
            return null;
        const packageJson = (0, n8n_workflow_1.jsonParse)(content, { fallbackValue: null });
        if (packageJson?.dependencies)
            return packageJson;
        this.logger.warn('Community package ledger is unusable, rebuilding it');
        return null;
    }
    async readInstalledPackageJson(packageName) {
        const packageJsonPath = `${this.resolvePackageDirectory(packageName)}/package.json`;
        try {
            const content = await (0, promises_1.readFile)(packageJsonPath, 'utf-8');
            return (0, n8n_workflow_1.jsonParse)(content, {
                fallbackValue: null,
            });
        }
        catch {
            return null;
        }
    }
    async assertPackageApiVersionSupported(packageName) {
        const packageJson = await this.readInstalledPackageJson(packageName);
        if (!packageJson)
            return;
        const check = (0, n8n_workflow_1.checkNodesApiVersion)(packageJson);
        if (check.compatible)
            return;
        if (check.reason === 'malformed') {
            throw new incompatible_nodes_api_version_error_1.IncompatibleNodesApiVersionError(`This community node declares an invalid n8n node API version (${JSON.stringify(check.declared)}). Install a version of the package with valid metadata or contact the package author.`, { requiredNodesApiVersion: null, supportedNodesApiVersion: n8n_workflow_1.N8N_NODES_API_VERSION });
        }
        throw new incompatible_nodes_api_version_error_1.IncompatibleNodesApiVersionError("This community node isn't compatible with your version of n8n. Update n8n to use it.", {
            requiredNodesApiVersion: check.required,
            supportedNodesApiVersion: n8n_workflow_1.N8N_NODES_API_VERSION,
        });
    }
    async readInstalledPackageVersion(packageName) {
        return (await this.readInstalledPackageJson(packageName))?.version ?? null;
    }
    async buildPackageJsonFromDatabase() {
        const installedPackages = await this.getAllInstalledPackages();
        return {
            name: 'installed-nodes',
            private: true,
            dependencies: Object.fromEntries(installedPackages.map(({ packageName, installedVersion }) => [
                packageName,
                installedVersion,
            ])),
        };
    }
    async ensurePackageJson() {
        if (await this.readPackageJson())
            return;
        const packageJson = await this.buildPackageJsonFromDatabase();
        await (0, promises_1.mkdir)(this.downloadFolder, { recursive: true });
        await (0, promises_1.writeFile)(this.packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf-8');
    }
    async checkForMissingPackages() {
        const installedPackages = await this.getAllInstalledPackages();
        const missingPackages = new Set();
        for (const installedPackage of installedPackages) {
            if (this.areNodesLoaded(installedPackage.installedNodes))
                continue;
            const packageJson = await this.readInstalledPackageJson(installedPackage.packageName);
            const apiVersionCheck = packageJson && (0, n8n_workflow_1.checkNodesApiVersion)(packageJson);
            if (apiVersionCheck && !apiVersionCheck.compatible) {
                const requirement = apiVersionCheck.reason === 'malformed'
                    ? `an invalid n8nNodesApiVersion (${JSON.stringify(apiVersionCheck.declared)})`
                    : `node API version ${apiVersionCheck.required}, but this n8n version supports up to ${n8n_workflow_1.N8N_NODES_API_VERSION}`;
                this.logger.warn(`Not reinstalling package "${installedPackage.packageName}": it requires ${requirement}. Upgrade n8n to use this package, or uninstall it in Settings > Community nodes.`);
                continue;
            }
            missingPackages.add({
                packageName: installedPackage.packageName,
                version: installedPackage.installedVersion,
            });
        }
        if (missingPackages.size === 0)
            return;
        const { reinstallMissing } = this.config;
        if (reinstallMissing) {
            this.logger.info('Attempting to reinstall missing packages', {
                missingPackages: [...missingPackages],
            });
            const environment = process.env.ENVIRONMENT === 'staging' ? 'staging' : 'production';
            const packageNames = [...missingPackages].map((p) => p.packageName);
            let vettedPackages = [];
            try {
                vettedPackages = await (0, community_node_types_utils_1.getCommunityNodeTypes)(environment, {
                    filters: {
                        packageName: {
                            $in: packageNames,
                        },
                    },
                    fields: ['packageName', 'npmVersion', 'checksum', 'nodeVersions'],
                }, this.config.aiNodeSdkVersion, this.config.nodesApiVersion);
            }
            catch (error) {
                this.logger.error(`Failed to fetch community packages from Strapi: ${(0, ensure_error_1.ensureError)(error).message}`);
            }
            for (const missingPackage of missingPackages) {
                try {
                    const vettedPackage = vettedPackages.find((p) => p.packageName === missingPackage.packageName);
                    let checksum;
                    if (vettedPackage) {
                        if (vettedPackage.npmVersion === missingPackage.version) {
                            checksum = vettedPackage.checksum;
                        }
                        else {
                            checksum = vettedPackage.nodeVersions?.find((v) => v.npmVersion === missingPackage.version)?.checksum;
                        }
                    }
                    await this.installPackage(missingPackage.packageName, missingPackage.version, checksum);
                    missingPackages.delete(missingPackage);
                }
                catch (error) {
                    this.logger.error(`Failed to reinstall community package ${missingPackage.packageName}: ${(0, ensure_error_1.ensureError)(error).message}`);
                }
            }
            if (missingPackages.size === 0) {
                this.logger.info('Packages reinstalled successfully. Resuming regular initialization.');
            }
            await this.loadNodesAndCredentials.postProcessLoaders();
            this.loadNodesAndCredentials.releaseTypes();
        }
        else {
            this.logger.warn('n8n detected that some packages are missing. For more information, visit https://docs.n8n.io/integrations/community-nodes/troubleshooting/');
        }
    }
    async installPackage(packageName, version, checksum) {
        return await this.installOrUpdatePackage(packageName, { version, checksum });
    }
    async updatePackage(packageName, installedPackage, version, checksum) {
        return await this.installOrUpdatePackage(packageName, { installedPackage, version, checksum });
    }
    async removePackage(packageName, installedPackage) {
        await this.removeNpmPackage(packageName);
        await this.removePackageFromDatabase(installedPackage);
        void this.publisher
            .publishCommand({
            command: 'community-package-uninstall',
            payload: { packageName },
        })
            .catch((error) => {
            this.logger.warn('Failed to publish community package uninstall event', {
                error: (0, ensure_error_1.ensureError)(error),
                packageName,
            });
        });
    }
    getNpmRegistry() {
        const { registry } = this.config;
        if (registry !== DEFAULT_REGISTRY && !this.license.isCustomNpmRegistryEnabled()) {
            throw new feature_not_licensed_error_1.FeatureNotLicensedError(constants_1.LICENSE_FEATURES.COMMUNITY_NODES_CUSTOM_REGISTRY);
        }
        return registry;
    }
    getNpmAuthToken() {
        return this.config.authToken || undefined;
    }
    checkInstallPermissions(checksumProvided) {
        if (!this.config.unverifiedEnabled && !checksumProvided) {
            throw new n8n_workflow_1.UnexpectedError('Installation of unverified community packages is forbidden!');
        }
    }
    async runRegistryChecks(packageName, packageVersion, checksum) {
        this.checkInstallPermissions(Boolean(checksum));
        const packageStatus = await this.checkNpmPackageStatus(packageName);
        if (packageStatus.status !== constants_2.NPM_PACKAGE_STATUS_GOOD) {
            throw new n8n_workflow_1.UnexpectedError(`Package "${packageName}" is not allowed`);
        }
        const authToken = this.getNpmAuthToken();
        const registry = this.getNpmRegistry();
        if (checksum) {
            await (0, npm_utils_1.verifyIntegrity)(packageName, packageVersion, registry, checksum, authToken);
        }
        await (0, npm_utils_1.checkIfVersionExistsOrThrow)(packageName, packageVersion, registry, authToken);
        return authToken;
    }
    async installOrUpdatePackage(packageName, options = {}) {
        return await this.packageMutex(async () => {
            const isUpdate = 'installedPackage' in options;
            const packageVersion = !options.version ? 'latest' : options.version;
            const authToken = await this.runRegistryChecks(packageName, packageVersion, options.checksum);
            const previousVersion = isUpdate
                ? ((await this.readPackageJson())?.dependencies[packageName] ??
                    options.installedPackage.installedVersion)
                : (await this.readPackageJson())?.dependencies[packageName];
            const backupDirectory = await this.backupPackageDirectory(packageName);
            try {
                await this.downloadPackage(packageName, packageVersion, authToken);
                await this.assertPackageApiVersionSupported(packageName);
            }
            catch (error) {
                await this.restorePackageFiles(packageName, {
                    backupDirectory,
                    previousVersion,
                });
                if (error instanceof Error && error.message === constants_2.RESPONSE_ERROR_MESSAGES.PACKAGE_NOT_FOUND) {
                    throw new n8n_workflow_1.UserError('npm package not found', { extra: { packageName } });
                }
                throw error;
            }
            let loader;
            try {
                await this.loadNodesAndCredentials.unloadPackage(packageName);
                loader = await this.loadNodesAndCredentials.loadPackage(packageName);
            }
            catch (error) {
                await this.restoreFailedPackageInstallation(packageName, {
                    backupDirectory,
                    previousVersion,
                });
                throw new n8n_workflow_1.UnexpectedError(constants_2.RESPONSE_ERROR_MESSAGES.PACKAGE_LOADING_FAILED, {
                    cause: error,
                });
            }
            if (loader.loadedNodes.length > 0) {
                let installedPackage;
                try {
                    installedPackage = isUpdate
                        ? await this.replaceInstalledPackage(options.installedPackage, loader)
                        : await this.persistInstalledPackage(loader);
                }
                catch (error) {
                    await this.restoreFailedPackageInstallation(packageName, {
                        backupDirectory,
                        previousVersion,
                    });
                    throw new n8n_workflow_1.UnexpectedError('Failed to save installed package', {
                        extra: { packageName },
                        cause: error,
                    });
                }
                await this.discardBackupDirectory(packageName, backupDirectory);
                const { installedVersion } = installedPackage;
                void this.publisher
                    .publishCommand({
                    command: isUpdate ? 'community-package-update' : 'community-package-install',
                    payload: {
                        packageName,
                        packageVersion: installedVersion,
                        checksum: options.checksum,
                    },
                })
                    .catch((error) => {
                    this.logger.warn('Failed to publish community package install/update event', {
                        error: (0, ensure_error_1.ensureError)(error),
                        packageName,
                        packageVersion: installedVersion,
                    });
                });
                await this.loadNodesAndCredentials.postProcessLoaders();
                this.loadNodesAndCredentials.releaseTypes();
                this.logger.info(`Community package installed: ${packageName}`);
                return installedPackage;
            }
            else {
                await this.restoreFailedPackageInstallation(packageName, {
                    backupDirectory,
                    previousVersion,
                });
                throw new n8n_workflow_1.UnexpectedError(constants_2.RESPONSE_ERROR_MESSAGES.PACKAGE_DOES_NOT_CONTAIN_NODES);
            }
        });
    }
    assertPackageChangesAllowed() {
        if (!this.config.enabled) {
            throw new n8n_workflow_1.UserError('Community packages are disabled on this instance');
        }
        if (this.config.preventLoading) {
            throw new n8n_workflow_1.UserError('Community package loading is disabled on this instance');
        }
    }
    async handleInstallEvent({ packageName, packageVersion, checksum, }) {
        let accepted = false;
        try {
            this.assertPackageChangesAllowed();
            const parsed = this.parseNpmPackageName(packageName);
            const installedPackage = await this.findInstalledPackage(parsed.packageName);
            if (!installedPackage) {
                throw new n8n_workflow_1.UnexpectedError('No installed package record found', {
                    extra: { packageName: parsed.packageName },
                });
            }
            const resolvedVersion = installedPackage.installedVersion;
            if (!isValidVersionSpecifier(resolvedVersion)) {
                throw new n8n_workflow_1.UnexpectedError(`Invalid version: ${resolvedVersion}`);
            }
            const versionMatches = resolvedVersion === packageVersion;
            if (!versionMatches) {
                this.logger.warn('Community package version differs from the stored record', {
                    packageName: installedPackage.packageName,
                    packageVersion,
                    installedVersion: resolvedVersion,
                });
            }
            await this.runRegistryChecks(installedPackage.packageName, resolvedVersion, versionMatches ? checksum : undefined);
            accepted = true;
            await this.installOrUpdateNpmPackage(installedPackage.packageName, resolvedVersion);
        }
        catch (error) {
            const details = {
                packageName,
                reason: (0, ensure_error_1.ensureError)(error).message,
                ...(error instanceof incompatible_nodes_api_version_error_1.IncompatibleNodesApiVersionError ? error.meta : {}),
            };
            if (accepted)
                this.logger.error('Failed to install community package', details);
            else
                this.logger.warn('Skipped installing community package', details);
        }
    }
    async handleUninstallEvent({ packageName }) {
        let accepted = false;
        try {
            this.assertPackageChangesAllowed();
            const parsed = this.parseNpmPackageName(packageName);
            const installedPackage = await this.findInstalledPackage(parsed.packageName);
            if (installedPackage) {
                throw new n8n_workflow_1.UnexpectedError('Installed package record still present', {
                    extra: { packageName: parsed.packageName },
                });
            }
            accepted = true;
            await this.removeNpmPackage(parsed.packageName, { requireNoRecord: true });
        }
        catch (error) {
            const details = { packageName, reason: (0, ensure_error_1.ensureError)(error).message };
            if (accepted)
                this.logger.error('Failed to uninstall community package', details);
            else
                this.logger.warn('Skipped uninstalling community package', details);
        }
    }
    async installOrUpdateNpmPackage(packageName, packageVersion) {
        return await this.packageMutex(async () => {
            const installedPackage = await this.findInstalledPackage(packageName);
            if (installedPackage?.installedVersion !== packageVersion) {
                throw new n8n_workflow_1.UnexpectedError('Installed package record changed while waiting for the lock', {
                    extra: { packageName },
                });
            }
            const onDiskVersion = await this.readInstalledPackageVersion(packageName);
            if (onDiskVersion === packageVersion && this.loadNodesAndCredentials.loaders[packageName]) {
                this.logger.debug(`Community package ${packageName} already at ${packageVersion}, skipping`);
                return;
            }
            const authToken = this.getNpmAuthToken();
            const backupDirectory = await this.backupPackageDirectory(packageName);
            try {
                await this.downloadPackage(packageName, packageVersion, authToken);
                await this.assertPackageApiVersionSupported(packageName);
            }
            catch (error) {
                await this.restorePackageDirectory(packageName, backupDirectory);
                throw error;
            }
            try {
                await this.loadNodesAndCredentials.unloadPackage(packageName);
                await this.loadNodesAndCredentials.loadPackage(packageName);
                await this.loadNodesAndCredentials.postProcessLoaders();
                this.loadNodesAndCredentials.releaseTypes();
            }
            finally {
                await this.discardBackupDirectory(packageName, backupDirectory);
            }
            this.logger.info(`Community package installed: ${packageName}`);
        });
    }
    async removeNpmPackage(packageName, options = {}) {
        return await this.packageMutex(async () => {
            if (options.requireNoRecord && (await this.findInstalledPackage(packageName))) {
                throw new n8n_workflow_1.UnexpectedError('Installed package record restored while waiting for the lock', {
                    extra: { packageName },
                });
            }
            await this.deletePackageDirectory(packageName);
            try {
                await this.removePackageJsonDependency(packageName);
            }
            catch (error) {
                this.logger.warn('Failed to remove community package from the ledger', {
                    error: (0, ensure_error_1.ensureError)(error),
                    packageName,
                });
            }
            await this.loadNodesAndCredentials.unloadPackage(packageName);
            await this.loadNodesAndCredentials.postProcessLoaders();
            this.loadNodesAndCredentials.releaseTypes();
            this.logger.info(`Community package uninstalled: ${packageName}`);
        });
    }
    resolvePackageDirectory(packageName) {
        const nodeModulesDirectory = `${this.downloadFolder}/node_modules`;
        const packageDirectory = `${nodeModulesDirectory}/${packageName}`;
        const relativePath = (0, node_path_1.relative)((0, node_path_1.resolve)(nodeModulesDirectory), (0, node_path_1.resolve)(packageDirectory));
        if (relativePath === '' ||
            relativePath.startsWith('..') ||
            relativePath.split(node_path_1.sep).join('/') !== packageName) {
            throw new n8n_workflow_1.UserError('Invalid package name', { extra: { packageName } });
        }
        return packageDirectory;
    }
    async packageDirectoryExists(packageName) {
        try {
            await (0, promises_1.access)(this.resolvePackageDirectory(packageName), promises_1.constants.F_OK);
            return true;
        }
        catch {
            return false;
        }
    }
    async backupPackageDirectory(packageName) {
        if (!(await this.packageDirectoryExists(packageName)))
            return undefined;
        const packageDirectory = this.resolvePackageDirectory(packageName);
        const backupDirectory = `${packageDirectory}.backup-${Date.now()}`;
        await (0, promises_1.rename)(packageDirectory, backupDirectory);
        return backupDirectory;
    }
    async discardBackupDirectory(packageName, backupDirectory) {
        if (!backupDirectory)
            return;
        try {
            await (0, promises_1.rm)(backupDirectory, { recursive: true, force: true, maxRetries: 3 });
        }
        catch (error) {
            this.logger.warn('Failed to remove community package backup directory', {
                error: (0, ensure_error_1.ensureError)(error),
                packageName,
                backupDirectory,
            });
        }
    }
    async restorePackageDirectoryFromBackup(packageName, backupDirectory) {
        await this.deletePackageDirectory(packageName);
        if (!backupDirectory)
            return;
        await (0, promises_1.rename)(backupDirectory, this.resolvePackageDirectory(packageName));
    }
    async restorePackageDirectory(packageName, backupDirectory) {
        try {
            await this.restorePackageDirectoryFromBackup(packageName, backupDirectory);
        }
        catch (cleanupError) {
            this.logger.warn('Failed to restore community package directory after failed installation', {
                error: (0, ensure_error_1.ensureError)(cleanupError),
                packageName,
                backupDirectory,
            });
        }
    }
    async restoreLoadedPackage(packageName) {
        try {
            await this.loadNodesAndCredentials.unloadPackage(packageName);
            if (await this.packageDirectoryExists(packageName)) {
                await this.loadNodesAndCredentials.loadPackage(packageName);
            }
        }
        catch (cleanupError) {
            this.logger.warn('Failed to reload community package after failed installation', {
                error: (0, ensure_error_1.ensureError)(cleanupError),
                packageName,
            });
        }
        try {
            await this.loadNodesAndCredentials.postProcessLoaders();
            this.loadNodesAndCredentials.releaseTypes();
        }
        catch (cleanupError) {
            this.logger.warn('Failed to refresh node types after failed community package install', {
                error: (0, ensure_error_1.ensureError)(cleanupError),
                packageName,
            });
        }
    }
    async restorePackageFiles(packageName, options) {
        const { backupDirectory, previousVersion } = options;
        await this.restorePackageDirectory(packageName, backupDirectory);
        try {
            if (previousVersion) {
                await this.updatePackageJsonDependency(packageName, previousVersion);
            }
            else {
                await this.removePackageJsonDependency(packageName);
            }
        }
        catch (cleanupError) {
            this.logger.warn('Failed to restore community package after failed installation', {
                error: (0, ensure_error_1.ensureError)(cleanupError),
                packageName,
            });
        }
    }
    async restoreFailedPackageInstallation(packageName, options) {
        await this.restorePackageFiles(packageName, options);
        await this.restoreLoadedPackage(packageName);
    }
    async downloadPackage(packageName, packageVersion, authToken) {
        const registry = this.getNpmRegistry();
        const packageDirectory = this.resolvePackageDirectory(packageName);
        await (0, promises_1.mkdir)(packageDirectory, { recursive: true });
        const tarOutput = await (0, npm_utils_1.executeNpmCommand)(['pack', `${packageName}@${packageVersion}`, '--quiet'], { cwd: this.downloadFolder, registry, authToken });
        const tarballName = tarOutput?.trim();
        try {
            await asyncExecFile('tar', ['-xzf', tarballName, '-C', packageDirectory, '--strip-components=1'], { cwd: this.downloadFolder });
            const packageJsonPath = `${packageDirectory}/package.json`;
            const packageJsonContent = await (0, promises_1.readFile)(packageJsonPath, 'utf-8');
            const { devDependencies, peerDependencies, optionalDependencies, ...packageJson } = JSON.parse(packageJsonContent);
            await (0, promises_1.writeFile)(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf-8');
            await (0, npm_utils_1.executeNpmCommand)([
                'install',
                '--audit=false',
                '--fund=false',
                '--bin-links=false',
                '--install-strategy=shallow',
                '--ignore-scripts=true',
                '--package-lock=false',
            ], { cwd: packageDirectory, registry, authToken });
            await this.updatePackageJsonDependency(packageName, packageJson.version);
        }
        finally {
            if (tarballName) {
                await (0, promises_1.rm)((0, node_path_1.join)(this.downloadFolder, tarballName));
            }
        }
        return packageDirectory;
    }
    async deletePackageDirectory(packageName) {
        const packageDirectory = this.resolvePackageDirectory(packageName);
        await (0, promises_1.rm)(packageDirectory, { recursive: true, force: true, maxRetries: 3 });
    }
    async updatePackageJsonDependency(packageName, version) {
        await this.mutatePackageJsonDependencies((dependencies) => {
            dependencies[packageName] = version;
        });
    }
    async removePackageJsonDependency(packageName) {
        await this.mutatePackageJsonDependencies((dependencies) => {
            delete dependencies[packageName];
        });
    }
    async mutatePackageJsonDependencies(mutate) {
        const packageJson = (await this.readPackageJson()) ?? (await this.buildPackageJsonFromDatabase());
        mutate(packageJson.dependencies);
        await (0, promises_1.writeFile)(this.packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf-8');
    }
};
exports.CommunityPackagesService = CommunityPackagesService;
__decorate([
    (0, decorators_1.OnPubSubEvent)('community-package-install'),
    (0, decorators_1.OnPubSubEvent)('community-package-update'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CommunityPackagesService.prototype, "handleInstallEvent", null);
__decorate([
    (0, decorators_1.OnPubSubEvent)('community-package-uninstall'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CommunityPackagesService.prototype, "handleUninstallEvent", null);
exports.CommunityPackagesService = CommunityPackagesService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [n8n_core_1.InstanceSettings, backend_common_1.Logger, installed_packages_repository_1.InstalledPackagesRepository, load_nodes_and_credentials_1.LoadNodesAndCredentials, publisher_service_1.Publisher, license_1.License, community_packages_config_1.CommunityPackagesConfig, backend_network_1.OutboundHttp])
], CommunityPackagesService);
//# sourceMappingURL=community-packages.service.js.map