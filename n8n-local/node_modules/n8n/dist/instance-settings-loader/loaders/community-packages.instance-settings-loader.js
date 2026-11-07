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
exports.CommunityPackagesInstanceSettingsLoader = void 0;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const zod_1 = require("zod");
const community_node_types_utils_1 = require("../../modules/community-packages/community-node-types-utils");
const community_node_types_service_1 = require("../../modules/community-packages/community-node-types.service");
const community_packages_config_1 = require("../../modules/community-packages/community-packages.config");
const community_packages_service_1 = require("../../modules/community-packages/community-packages.service");
const instance_bootstrapping_error_1 = require("../instance-bootstrapping.error");
const envPackageSchema = zod_1.z
    .object({
    name: zod_1.z.string().min(1),
    version: zod_1.z.string().min(1).optional(),
    checksum: zod_1.z.string().min(1).optional(),
})
    .strict();
const envPackagesSchema = zod_1.z.array(envPackageSchema);
let CommunityPackagesInstanceSettingsLoader = class CommunityPackagesInstanceSettingsLoader {
    constructor(config, communityPackagesConfig, communityPackagesService, communityNodeTypesService, workflowRepository, logger) {
        this.config = config;
        this.communityPackagesConfig = communityPackagesConfig;
        this.communityPackagesService = communityPackagesService;
        this.communityNodeTypesService = communityNodeTypesService;
        this.workflowRepository = workflowRepository;
        this.logger = logger;
        this.logger = this.logger.scoped('instance-settings-loader');
    }
    async run() {
        if (!this.config.communityPackagesManagedByEnv) {
            this.logger.debug('communityPackagesManagedByEnv is disabled — skipping community packages env config');
            return 'skipped';
        }
        if (!this.communityPackagesConfig.enabled) {
            this.logger.warn('N8N_COMMUNITY_PACKAGES_MANAGED_BY_ENV is enabled but community packages are disabled (N8N_COMMUNITY_PACKAGES_ENABLED=false) — skipping');
            return 'skipped';
        }
        this.logger.info('communityPackagesManagedByEnv is enabled — reconciling installed community packages from env vars');
        let items;
        try {
            items = this.parseAndValidate(this.config.communityPackages);
        }
        catch (error) {
            const message = error.message ?? 'Unknown error';
            this.logger.error(message);
            throw new instance_bootstrapping_error_1.InstanceBootstrappingError(message);
        }
        const resolved = [];
        for (const item of items) {
            resolved.push(await this.resolveVersionAndChecksum(item));
        }
        const installed = await this.communityPackagesService.getAllInstalledPackages();
        const { toInstall, toUpdate, toRemove } = this.buildReconciliationPlan(resolved, installed);
        let changed = false;
        for (const item of toInstall) {
            try {
                await this.communityPackagesService.installPackage(item.name, item.version, item.checksum);
                this.logger.info(`Installed community package ${formatRef(item)} from env`);
                changed = true;
            }
            catch (error) {
                this.logger.error(`Failed to install community package ${formatRef(item)} from env: ${(0, ensure_error_1.ensureError)(error).message}`);
            }
        }
        for (const { env, installed: existing } of toUpdate) {
            try {
                await this.communityPackagesService.updatePackage(env.name, existing, env.version, env.checksum);
                this.logger.info(`Updated community package '${env.name}' from ${existing.installedVersion} to ${env.version} from env`);
                changed = true;
            }
            catch (error) {
                this.logger.error(`Failed to update community package '${env.name}' to ${env.version} from env: ${(0, ensure_error_1.ensureError)(error).message}`);
            }
        }
        for (const pkg of toRemove) {
            const { packageName } = pkg;
            const dependentNodeCount = pkg.installedNodes?.length ?? 0;
            const affectedWorkflows = await this.findWorkflowsReferencingPackage(pkg);
            try {
                await this.communityPackagesService.removePackage(packageName, pkg);
                this.logger.warn(`Removed community package '${packageName}' (had ${dependentNodeCount} registered node type(s)) — not declared in N8N_COMMUNITY_PACKAGES`, {
                    packageName,
                    installedVersion: pkg.installedVersion,
                    workflowIds: affectedWorkflows.map((w) => w.id),
                    activeWorkflowIds: affectedWorkflows.filter((w) => w.active).map((w) => w.id),
                });
                changed = true;
            }
            catch (error) {
                this.logger.error(`Failed to remove community package '${packageName}' that is not declared in env: ${(0, ensure_error_1.ensureError)(error).message}`);
            }
        }
        return changed ? 'created' : 'skipped';
    }
    async findWorkflowsReferencingPackage(pkg) {
        const nodeTypes = pkg.installedNodes?.map((node) => node.type) ?? [];
        if (nodeTypes.length === 0)
            return [];
        try {
            return await this.workflowRepository.findWorkflowsWithNodeType(nodeTypes);
        }
        catch (error) {
            this.logger.warn(`Failed to check workflows referencing community package '${pkg.packageName}' before removal`, { packageName: pkg.packageName, error: (0, ensure_error_1.ensureError)(error) });
            return [];
        }
    }
    buildReconciliationPlan(resolved, installed) {
        const installedByName = new Map(installed.map((p) => [p.packageName, p]));
        const desiredNames = new Set(resolved.map((i) => i.name));
        const toInstall = [];
        const toUpdate = [];
        const toRemove = [];
        for (const item of resolved) {
            const existing = installedByName.get(item.name);
            if (!existing) {
                toInstall.push(item);
            }
            else if (item.version !== undefined && existing.installedVersion !== item.version) {
                toUpdate.push({ env: item, installed: existing });
            }
        }
        for (const pkg of installed) {
            if (!desiredNames.has(pkg.packageName)) {
                toRemove.push(pkg);
            }
        }
        return { toInstall, toUpdate, toRemove };
    }
    async resolveVersionAndChecksum(item) {
        if (item.checksum) {
            return { name: item.name, version: item.version, checksum: item.checksum };
        }
        let vetted;
        try {
            vetted = await this.communityNodeTypesService.findVetted(item.name);
        }
        catch (error) {
            this.logger.warn(`Failed to look up vetted checksum for community package '${item.name}': ${(0, ensure_error_1.ensureError)(error).message}`);
        }
        const { version: resolvedVersion, checksum } = vetted
            ? (0, community_node_types_utils_1.selectVettedVersion)(vetted, item.version)
            : { version: item.version, checksum: undefined };
        if (!checksum && !this.communityPackagesConfig.unverifiedEnabled) {
            const ref = resolvedVersion ? `'${item.name}@${resolvedVersion}'` : `'${item.name}'`;
            throw new instance_bootstrapping_error_1.InstanceBootstrappingError(`N8N_COMMUNITY_PACKAGES: no checksum available for ${ref} and unverified packages are disabled`);
        }
        if (resolvedVersion === undefined) {
            this.logger.warn(`Community package '${item.name}' has no pinned version and no vetted entry — installed version will not be reconciled across restarts`);
        }
        return { name: item.name, version: resolvedVersion, checksum };
    }
    parseAndValidate(raw) {
        const trimmed = (raw ?? '').trim();
        if (trimmed.length === 0)
            return [];
        let parsed;
        try {
            parsed = JSON.parse(trimmed);
        }
        catch (error) {
            throw new Error(`N8N_COMMUNITY_PACKAGES is not valid JSON: ${error.message}`);
        }
        const result = envPackagesSchema.safeParse(parsed);
        if (!result.success) {
            const issue = result.error.issues[0];
            const path = issue.path.length > 0 ? issue.path.join('.') : '(root)';
            throw new Error(`N8N_COMMUNITY_PACKAGES validation failed at "${path}": ${issue.message}`);
        }
        const items = result.data;
        const seenNames = new Set();
        const normalized = items.map((item, index) => {
            let parsed;
            try {
                parsed = this.communityPackagesService.parseNpmPackageName(item.name);
            }
            catch (error) {
                throw new Error(`N8N_COMMUNITY_PACKAGES has an invalid package name "${item.name}" at index ${index}: ${error.message}`);
            }
            if (parsed.version !== undefined &&
                item.version !== undefined &&
                parsed.version !== item.version) {
                throw new Error(`N8N_COMMUNITY_PACKAGES has conflicting versions for "${parsed.packageName}" at index ${index}: "${parsed.version}" in name vs "${item.version}" in version field`);
            }
            const name = parsed.packageName;
            const version = item.version ?? parsed.version;
            if (version !== undefined && !(0, community_packages_service_1.isValidVersionSpecifier)(version)) {
                throw new Error(`N8N_COMMUNITY_PACKAGES has an invalid version "${version}" for package "${name}" at index ${index}`);
            }
            if (seenNames.has(name)) {
                throw new Error(`N8N_COMMUNITY_PACKAGES has duplicate package name "${name}" at index ${index}`);
            }
            seenNames.add(name);
            if (item.checksum !== undefined && version === undefined) {
                throw new Error(`N8N_COMMUNITY_PACKAGES has a checksum but no version for package "${name}" at index ${index}: checksum requires a version`);
            }
            return { name, version, checksum: item.checksum };
        });
        return normalized;
    }
};
exports.CommunityPackagesInstanceSettingsLoader = CommunityPackagesInstanceSettingsLoader;
exports.CommunityPackagesInstanceSettingsLoader = CommunityPackagesInstanceSettingsLoader = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [config_1.InstanceSettingsLoaderConfig, community_packages_config_1.CommunityPackagesConfig, community_packages_service_1.CommunityPackagesService, community_node_types_service_1.CommunityNodeTypesService, db_1.WorkflowRepository, backend_common_1.Logger])
], CommunityPackagesInstanceSettingsLoader);
const formatRef = (item) => item.version ? `'${item.name}@${item.version}'` : `'${item.name}'`;
//# sourceMappingURL=community-packages.instance-settings-loader.js.map