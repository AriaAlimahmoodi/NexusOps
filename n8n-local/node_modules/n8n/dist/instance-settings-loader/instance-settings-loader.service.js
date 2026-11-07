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
exports.InstanceSettingsLoaderService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const community_packages_instance_settings_loader_1 = require("./loaders/community-packages.instance-settings-loader");
const log_streaming_instance_settings_loader_1 = require("./loaders/log-streaming.instance-settings-loader");
const mcp_settings_loader_1 = require("./loaders/mcp-settings.loader");
const owner_instance_settings_loader_1 = require("./loaders/owner.instance-settings-loader");
const security_policy_instance_settings_loader_1 = require("./loaders/security-policy.instance-settings-loader");
const sso_instance_settings_loader_1 = require("./loaders/sso/sso.instance-settings-loader");
let InstanceSettingsLoaderService = class InstanceSettingsLoaderService {
    constructor(logger, ownerLoader, ssoLoader, securityPolicyLoader, logStreamingLoader, mcpLoader, communityPackagesLoader) {
        this.logger = logger;
        this.ownerLoader = ownerLoader;
        this.ssoLoader = ssoLoader;
        this.securityPolicyLoader = securityPolicyLoader;
        this.logStreamingLoader = logStreamingLoader;
        this.mcpLoader = mcpLoader;
        this.communityPackagesLoader = communityPackagesLoader;
        this.logger = this.logger.scoped('instance-settings-loader');
    }
    async init() {
        await this.run('owner', async () => await this.ownerLoader.run());
        await this.run('sso', async () => await this.ssoLoader.run());
        await this.run('security-policy', async () => await this.securityPolicyLoader.run());
        await this.run('log-streaming', async () => await this.logStreamingLoader.run());
        await this.run('mcp', async () => await this.mcpLoader.run());
        await this.run('community-packages', async () => await this.communityPackagesLoader.run());
    }
    async run(name, fn) {
        const result = await fn();
        this.logger.debug(`Instance settings loader "${name}": ${result}`);
    }
};
exports.InstanceSettingsLoaderService = InstanceSettingsLoaderService;
exports.InstanceSettingsLoaderService = InstanceSettingsLoaderService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, owner_instance_settings_loader_1.OwnerInstanceSettingsLoader, sso_instance_settings_loader_1.SsoInstanceSettingsLoader, security_policy_instance_settings_loader_1.SecurityPolicyInstanceSettingsLoader, log_streaming_instance_settings_loader_1.LogStreamingInstanceSettingsLoader, mcp_settings_loader_1.McpSettingsLoader, community_packages_instance_settings_loader_1.CommunityPackagesInstanceSettingsLoader])
], InstanceSettingsLoaderService);
//# sourceMappingURL=instance-settings-loader.service.js.map