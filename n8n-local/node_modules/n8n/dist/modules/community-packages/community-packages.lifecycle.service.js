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
exports.CommunityPackagesLifecycleService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const n8n_workflow_1 = require("n8n-workflow");
const constants_1 = require("../../constants");
const errors_1 = require("@n8n/errors");
const incompatible_nodes_api_version_error_1 = require("../../errors/response-errors/incompatible-nodes-api-version.error");
const push_1 = require("../../push");
const community_node_types_utils_1 = require("./community-node-types-utils");
const community_node_types_service_1 = require("./community-node-types.service");
const community_packages_config_1 = require("./community-packages.config");
const community_packages_service_1 = require("./community-packages.service");
const npm_utils_1 = require("./npm-utils");
const { PACKAGE_NOT_INSTALLED, PACKAGE_NAME_NOT_PROVIDED, PACKAGE_VERSION_NOT_FOUND, PACKAGE_DOES_NOT_CONTAIN_NODES, PACKAGE_NOT_FOUND, } = constants_1.RESPONSE_ERROR_MESSAGES;
const isCommunityPackageInstallClientError = (error) => [PACKAGE_VERSION_NOT_FOUND, PACKAGE_DOES_NOT_CONTAIN_NODES, PACKAGE_NOT_FOUND].some((msg) => typeof error.message === 'string' && error.message.includes(msg));
const MANAGED_BY_ENV_MESSAGE = 'Community packages are managed via environment variables on this instance and cannot be modified through the API.';
let CommunityPackagesLifecycleService = class CommunityPackagesLifecycleService {
    constructor(logger, push, communityPackagesService, eventService, communityNodeTypesService, instanceSettings, communityPackagesConfig, instanceSettingsLoaderConfig) {
        this.logger = logger;
        this.push = push;
        this.communityPackagesService = communityPackagesService;
        this.eventService = eventService;
        this.communityNodeTypesService = communityNodeTypesService;
        this.instanceSettings = instanceSettings;
        this.communityPackagesConfig = communityPackagesConfig;
        this.instanceSettingsLoaderConfig = instanceSettingsLoaderConfig;
    }
    assertNotManagedByEnv() {
        if (this.instanceSettingsLoaderConfig.communityPackagesManagedByEnv) {
            throw new errors_1.BadRequestError(MANAGED_BY_ENV_MESSAGE);
        }
    }
    async resolveVetted(name, requestedVersion) {
        if (this.communityPackagesConfig.unverifiedEnabled) {
            return { version: requestedVersion, checksum: undefined };
        }
        const vettedPackage = await this.communityNodeTypesService.findVetted(name);
        if (!vettedPackage) {
            throw new errors_1.BadRequestError(`Package ${name} is not vetted for installation`);
        }
        const { version, checksum } = (0, community_node_types_utils_1.selectVettedVersion)(vettedPackage, requestedVersion);
        if (!checksum) {
            throw new errors_1.BadRequestError(`Version ${version} of ${name} is not verified by n8n. Latest verified version is ${vettedPackage.npmVersion}`);
        }
        return { version, checksum };
    }
    async listInstalledPackages() {
        const installedPackages = await this.communityPackagesService.getAllInstalledPackages();
        if (installedPackages.length === 0)
            return [];
        let pendingUpdates;
        if (this.communityPackagesConfig.unverifiedEnabled) {
            try {
                await (0, npm_utils_1.executeNpmCommand)(['outdated', '--json'], {
                    doNotHandleError: true,
                    cwd: this.instanceSettings.nodesDownloadDir,
                    registry: this.communityPackagesConfig.registry,
                    authToken: this.communityPackagesConfig.authToken || undefined,
                });
            }
            catch (error) {
                if ((0, npm_utils_1.isNpmExecErrorWithStdout)(error) && error.code === 1) {
                    try {
                        pendingUpdates = (0, n8n_workflow_1.jsonParse)(error.stdout.trim());
                    }
                    catch (parseError) {
                        this.logger.warn('Failed to parse npm outdated output', {
                            error: (0, ensure_error_1.ensureError)(parseError),
                        });
                    }
                }
            }
        }
        const packages = this.communityPackagesService.matchPackagesWithUpdates(installedPackages, pendingUpdates);
        return this.communityPackagesService.withLoadStatus(packages);
    }
    async install(args, user, presentation) {
        this.assertNotManagedByEnv();
        const { name } = args;
        if (!name) {
            throw new errors_1.BadRequestError(PACKAGE_NAME_NOT_PROVIDED);
        }
        if (args.version && !(0, community_packages_service_1.isValidVersionSpecifier)(args.version)) {
            throw new errors_1.BadRequestError(`Invalid version: ${args.version}`);
        }
        let parsed;
        try {
            parsed = this.communityPackagesService.parseNpmPackageName(name);
        }
        catch (error) {
            throw new errors_1.BadRequestError(error instanceof Error ? error.message : 'Failed to parse package name');
        }
        const { version: packageVersion, checksum } = await this.resolveVetted(parsed.packageName, args.version ?? parsed.version);
        if (parsed.packageName === constants_1.STARTER_TEMPLATE_NAME) {
            const templateMessage = presentation === 'ui'
                ? [
                    `Package "${parsed.packageName}" is only a template`,
                    'Please enter an actual package to install',
                ].join('.')
                : `Package "${parsed.packageName}" is only a template. Please enter an actual package to install`;
            throw new errors_1.BadRequestError(templateMessage);
        }
        const existingPackage = await this.communityPackagesService.findInstalledPackage(parsed.packageName);
        if (existingPackage && this.communityPackagesService.isPackageLoaded(existingPackage)) {
            const alreadyMessage = presentation === 'ui'
                ? [
                    `Package "${parsed.packageName}" is already installed`,
                    'To update it, click the corresponding button in the UI',
                ].join('.')
                : `Package "${parsed.packageName}" is already installed`;
            throw new errors_1.BadRequestError(alreadyMessage);
        }
        const packageStatus = await this.communityPackagesService.checkNpmPackageStatus(name);
        if (packageStatus.status !== 'OK') {
            throw new errors_1.BadRequestError(`Package "${name}" is banned so it cannot be installed`);
        }
        let installedPackage;
        try {
            installedPackage = await this.communityPackagesService.installPackage(parsed.packageName, packageVersion, checksum);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : constants_1.UNKNOWN_FAILURE_REASON;
            this.eventService.emit('community-package-installed', {
                user,
                inputString: name,
                packageName: parsed.packageName,
                success: false,
                packageVersion,
                failureReason: errorMessage,
            });
            if (error instanceof incompatible_nodes_api_version_error_1.IncompatibleNodesApiVersionError)
                throw error;
            let message = [`Error loading package "${name}" `, errorMessage].join(':');
            if (error instanceof Error && error.cause instanceof Error) {
                message += `\nCause: ${error.cause.message}`;
            }
            const clientError = error instanceof Error ? isCommunityPackageInstallClientError(error) : false;
            throw new (clientError ? errors_1.BadRequestError : errors_1.InternalServerError)(message);
        }
        installedPackage.installedNodes.forEach((node) => {
            this.push.broadcast({
                type: 'reloadNodeType',
                data: {
                    name: node.type,
                    version: node.latestVersion,
                },
            });
        });
        this.eventService.emit('community-package-installed', {
            user,
            inputString: name,
            packageName: parsed.packageName,
            success: true,
            packageVersion,
            packageNodeNames: installedPackage.installedNodes.map((node) => node.name),
            packageAuthor: installedPackage.authorName,
            packageAuthorEmail: installedPackage.authorEmail,
        });
        return installedPackage;
    }
    async update(args, user, whenMissing) {
        this.assertNotManagedByEnv();
        const { name } = args;
        if (!name) {
            throw new errors_1.BadRequestError(PACKAGE_NAME_NOT_PROVIDED);
        }
        if (args.version && !(0, community_packages_service_1.isValidVersionSpecifier)(args.version)) {
            throw new errors_1.BadRequestError(`Invalid version: ${args.version}`);
        }
        let parsed;
        try {
            parsed = this.communityPackagesService.parseNpmPackageName(name);
        }
        catch (error) {
            throw new errors_1.BadRequestError(error instanceof Error ? error.message : 'Failed to parse package name');
        }
        const { packageName } = parsed;
        const { version, checksum } = await this.resolveVetted(packageName, args.version ?? parsed.version);
        const previouslyInstalledPackage = await this.communityPackagesService.findInstalledPackage(packageName);
        if (!previouslyInstalledPackage) {
            if (whenMissing === 'notFound') {
                throw new errors_1.NotFoundError(PACKAGE_NOT_INSTALLED);
            }
            throw new errors_1.BadRequestError(PACKAGE_NOT_INSTALLED);
        }
        try {
            const newInstalledPackage = await this.communityPackagesService.updatePackage(packageName, previouslyInstalledPackage, version, checksum);
            previouslyInstalledPackage.installedNodes.forEach((node) => {
                this.push.broadcast({
                    type: 'removeNodeType',
                    data: {
                        name: node.type,
                        version: node.latestVersion,
                    },
                });
            });
            newInstalledPackage.installedNodes.forEach((node) => {
                this.push.broadcast({
                    type: 'reloadNodeType',
                    data: {
                        name: node.type,
                        version: node.latestVersion,
                    },
                });
            });
            this.eventService.emit('community-package-updated', {
                user,
                packageName,
                packageVersionCurrent: previouslyInstalledPackage.installedVersion,
                packageVersionNew: newInstalledPackage.installedVersion,
                packageNodeNames: newInstalledPackage.installedNodes.map((n) => n.name),
                packageAuthor: newInstalledPackage.authorName,
                packageAuthorEmail: newInstalledPackage.authorEmail,
            });
            return newInstalledPackage;
        }
        catch (error) {
            if (error instanceof incompatible_nodes_api_version_error_1.IncompatibleNodesApiVersionError)
                throw error;
            previouslyInstalledPackage.installedNodes.forEach((node) => {
                this.push.broadcast({
                    type: 'removeNodeType',
                    data: {
                        name: node.type,
                        version: node.latestVersion,
                    },
                });
            });
            const message = [
                `Error updating package "${name}"`,
                error instanceof Error ? error.message : constants_1.UNKNOWN_FAILURE_REASON,
            ].join(':');
            throw new errors_1.InternalServerError(message, error);
        }
    }
    async uninstall(packageName, user, whenMissing) {
        this.assertNotManagedByEnv();
        if (!packageName) {
            throw new errors_1.BadRequestError(PACKAGE_NAME_NOT_PROVIDED);
        }
        try {
            this.communityPackagesService.parseNpmPackageName(packageName);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : constants_1.UNKNOWN_FAILURE_REASON;
            throw new errors_1.BadRequestError(message);
        }
        const installedPackage = await this.communityPackagesService.findInstalledPackage(packageName);
        if (!installedPackage) {
            if (whenMissing === 'notFound') {
                throw new errors_1.NotFoundError(PACKAGE_NOT_INSTALLED);
            }
            throw new errors_1.BadRequestError(PACKAGE_NOT_INSTALLED);
        }
        try {
            await this.communityPackagesService.removePackage(packageName, installedPackage);
        }
        catch (error) {
            const message = [
                `Error removing package "${packageName}"`,
                error instanceof Error ? error.message : constants_1.UNKNOWN_FAILURE_REASON,
            ].join(':');
            throw new errors_1.InternalServerError(message, error);
        }
        installedPackage.installedNodes.forEach((node) => {
            this.push.broadcast({
                type: 'removeNodeType',
                data: {
                    name: node.type,
                    version: node.latestVersion,
                },
            });
        });
        this.eventService.emit('community-package-deleted', {
            user,
            packageName,
            packageVersion: installedPackage.installedVersion,
            packageNodeNames: installedPackage.installedNodes.map((node) => node.name),
            packageAuthor: installedPackage.authorName,
            packageAuthorEmail: installedPackage.authorEmail,
        });
    }
};
exports.CommunityPackagesLifecycleService = CommunityPackagesLifecycleService;
exports.CommunityPackagesLifecycleService = CommunityPackagesLifecycleService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, push_1.Push, community_packages_service_1.CommunityPackagesService, backend_services_1.EventService, community_node_types_service_1.CommunityNodeTypesService, n8n_core_1.InstanceSettings, community_packages_config_1.CommunityPackagesConfig, config_1.InstanceSettingsLoaderConfig])
], CommunityPackagesLifecycleService);
//# sourceMappingURL=community-packages.lifecycle.service.js.map