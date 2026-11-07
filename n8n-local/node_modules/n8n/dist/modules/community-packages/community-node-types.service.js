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
exports.CommunityNodeTypesService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const cloneDeep_1 = __importDefault(require("lodash/cloneDeep"));
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const n8n_workflow_1 = require("n8n-workflow");
const strapi_utils_1 = require("../../utils/strapi-utils");
const community_node_types_utils_1 = require("./community-node-types-utils");
const community_packages_config_1 = require("./community-packages.config");
const community_packages_service_1 = require("./community-packages.service");
const UPDATE_INTERVAL = 8 * 60 * 60 * 1000;
const RETRY_INTERVAL = 5 * 60 * 1000;
const STRAPI_ARRAY_LIMIT = 100;
let CommunityNodeTypesService = class CommunityNodeTypesService {
    constructor(logger, config, communityPackagesService, globalConfig) {
        this.logger = logger;
        this.config = config;
        this.communityPackagesService = communityPackagesService;
        this.globalConfig = globalConfig;
        this.communityNodeTypes = new Map();
        this.lastUpdateTimestamp = 0;
    }
    isLoadable(nodeTypeName) {
        const baseName = nodeTypeName.slice(0, -'Tool'.length);
        const isToolCopy = nodeTypeName.endsWith('Tool') &&
            this.communityNodeTypes.get(baseName)?.nodeDescription.usableAsTool === true;
        const loaderName = isToolCopy ? baseName : nodeTypeName;
        const { exclude, include } = this.globalConfig.nodes;
        if (exclude.includes(loaderName))
            return false;
        return include.length === 0 || include.includes(loaderName);
    }
    async detectUpdates(environment) {
        let communityNodesMetadata = [];
        try {
            communityNodesMetadata = await (0, community_node_types_utils_1.getCommunityNodesMetadata)(environment, this.config.aiNodeSdkVersion, this.config.nodesApiVersion);
        }
        catch (error) {
            this.logger.error('Failed to fetch community nodes metadata', {
                error: (0, ensure_error_1.ensureError)(error),
            });
            return { scheduleRetry: true };
        }
        const typesToUpdate = [];
        const metadataNames = new Set(communityNodesMetadata.map((entry) => entry.name));
        for (const entry of communityNodesMetadata) {
            const nodeType = this.communityNodeTypes.get(entry.name);
            if (!nodeType ||
                nodeType.npmVersion !== entry.npmVersion ||
                nodeType.updatedAt !== entry.updatedAt) {
                this.logger.debug(`Detected update for community node type: name - ${entry.name}; npmVersion - ${entry.npmVersion}; updatedAt - ${entry.updatedAt};`);
                typesToUpdate.push(entry.id);
            }
        }
        for (const [name, nodeType] of this.communityNodeTypes.entries()) {
            if (!metadataNames.has(name)) {
                this.logger.debug(`Detected removal of community node type: name - ${name}; id - ${nodeType.id};`);
                this.communityNodeTypes.delete(name);
            }
        }
        return { typesToUpdate };
    }
    async fetchNodeTypes() {
        try {
            const environment = this.detectEnvironment();
            let data = [];
            if (this.config.enabled && this.config.verifiedEnabled) {
                if (this.communityNodeTypes.size === 0) {
                    data = await (0, community_node_types_utils_1.getCommunityNodeTypes)(environment, {}, this.config.aiNodeSdkVersion, this.config.nodesApiVersion);
                    this.updateCommunityNodeTypes(data);
                    return;
                }
                const { typesToUpdate, scheduleRetry } = await this.detectUpdates(environment);
                if (scheduleRetry) {
                    this.setTimestampForRetry();
                    return;
                }
                if (!typesToUpdate?.length) {
                    this.lastUpdateTimestamp = Date.now();
                    return;
                }
                for (let i = 0; i < typesToUpdate.length; i += STRAPI_ARRAY_LIMIT) {
                    const batch = typesToUpdate.slice(i, i + STRAPI_ARRAY_LIMIT);
                    const qs = (0, strapi_utils_1.buildStrapiUpdateQuery)(batch);
                    const batchData = await (0, community_node_types_utils_1.getCommunityNodeTypes)(environment, qs, this.config.aiNodeSdkVersion, this.config.nodesApiVersion);
                    data.push(...batchData);
                }
            }
            this.updateCommunityNodeTypes(data);
        }
        catch (error) {
            this.logger.error('Failed to fetch community node types', { error: (0, ensure_error_1.ensureError)(error) });
        }
    }
    detectEnvironment() {
        const environment = process.env.ENVIRONMENT;
        if (environment === 'staging')
            return 'staging';
        if (backend_common_1.inProduction)
            return 'production';
        if (environment === 'production')
            return 'production';
        return 'staging';
    }
    updateCommunityNodeTypes(nodeTypes) {
        if (!nodeTypes?.length) {
            this.setTimestampForRetry();
            return;
        }
        this.setCommunityNodeTypes(nodeTypes);
        this.createAiTools();
        this.lastUpdateTimestamp = Date.now();
    }
    createAiTools() {
        const usableAsTools = Array.from(this.communityNodeTypes.values()).filter((nodeType) => nodeType.nodeDescription.usableAsTool &&
            !(0, n8n_workflow_1.isToolType)(nodeType.name) &&
            !nodeType.nodeDescription.group?.includes('trigger'));
        const forbiddenCategories = ['Recommended Tools'];
        for (const nodeType of usableAsTools) {
            const clonedNodeType = (0, cloneDeep_1.default)(nodeType);
            const toolSubcategories = clonedNodeType.nodeDescription.codex?.subcategories?.Tools ?? [
                'Other Tools',
            ];
            const filteredToolSubcategories = toolSubcategories.filter((subcategory) => !forbiddenCategories.includes(subcategory));
            clonedNodeType.name += 'Tool';
            clonedNodeType.nodeDescription.name += 'Tool';
            clonedNodeType.nodeDescription.inputs = [];
            clonedNodeType.nodeDescription.outputs = [n8n_workflow_1.NodeConnectionTypes.AiTool];
            clonedNodeType.nodeDescription.displayName += ' Tool';
            clonedNodeType.nodeDescription.codex = {
                categories: ['AI'],
                subcategories: {
                    AI: ['Tools'],
                    Tools: filteredToolSubcategories,
                },
                resources: clonedNodeType.nodeDescription.codex?.resources ?? {},
            };
            this.communityNodeTypes.set(clonedNodeType.name, clonedNodeType);
        }
    }
    setCommunityNodeTypes(nodeTypes) {
        for (const nodeType of nodeTypes) {
            this.communityNodeTypes.set(nodeType.name, nodeType);
        }
    }
    updateRequired() {
        if (!this.lastUpdateTimestamp)
            return true;
        return Date.now() - this.lastUpdateTimestamp > UPDATE_INTERVAL;
    }
    setTimestampForRetry() {
        const jitter = Math.floor(Math.random() * 4 * 60 * 1000) - 2 * 60 * 1000;
        this.lastUpdateTimestamp = Date.now() - (UPDATE_INTERVAL - RETRY_INTERVAL + jitter);
    }
    async createIsInstalled() {
        const installedPackages = (await this.communityPackagesService.getAllInstalledPackages()) ?? [];
        const installedPackageNames = new Set(installedPackages.map((p) => p.packageName));
        return (nodeType) => installedPackageNames.has(nodeType.packageName);
    }
    async getCommunityNodeTypes() {
        if (this.updateRequired()) {
            await this.fetchNodeTypes();
        }
        const isInstalled = await this.createIsInstalled();
        return Array.from(this.communityNodeTypes.values())
            .filter((nodeType) => this.isLoadable(nodeType.name))
            .map((nodeType) => ({
            ...nodeType,
            isInstalled: isInstalled(nodeType),
        }));
    }
    async getCommunityNodeType(type) {
        const nodeType = this.communityNodeTypes.get(type);
        const isInstalled = await this.createIsInstalled();
        if (!nodeType || !this.isLoadable(nodeType.name))
            return null;
        return { ...nodeType, isInstalled: isInstalled(nodeType) };
    }
    async findVettedNodeType(nodeType) {
        if (this.updateRequired()) {
            await this.fetchNodeTypes();
        }
        return await this.getCommunityNodeType(nodeType);
    }
    async findVetted(packageName) {
        if (this.updateRequired()) {
            await this.fetchNodeTypes();
        }
        const vettedTypes = Array.from(this.communityNodeTypes.values());
        return vettedTypes.find((nodeType) => nodeType.packageName === packageName);
    }
};
exports.CommunityNodeTypesService = CommunityNodeTypesService;
exports.CommunityNodeTypesService = CommunityNodeTypesService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, community_packages_config_1.CommunityPackagesConfig, community_packages_service_1.CommunityPackagesService, config_1.GlobalConfig])
], CommunityNodeTypesService);
//# sourceMappingURL=community-node-types.service.js.map