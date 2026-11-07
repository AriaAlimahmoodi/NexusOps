"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunityPackagesModule = void 0;
const config_1 = require("@n8n/config");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const node_path_1 = __importDefault(require("node:path"));
let CommunityPackagesModule = class CommunityPackagesModule {
    async init() {
        await import('./community-packages.controller.js');
        await import('./community-node-types.controller.js');
    }
    async commands() {
        await import('./community-node.command.js');
    }
    async entities() {
        const { InstalledNodes } = await import('./installed-nodes.entity.js');
        const { InstalledPackages } = await import('./installed-packages.entity.js');
        return [InstalledNodes, InstalledPackages];
    }
    async settings() {
        const { CommunityPackagesConfig } = await import('./community-packages.config.js');
        return {
            communityNodesEnabled: di_1.Container.get(CommunityPackagesConfig).enabled,
            unverifiedCommunityNodesEnabled: di_1.Container.get(CommunityPackagesConfig).unverifiedEnabled,
        };
    }
    async nodeLoaders() {
        const { CommunityPackagesConfig } = await import('./community-packages.config.js');
        if (di_1.Container.get(CommunityPackagesConfig).preventLoading)
            return [];
        const dir = node_path_1.default.join(di_1.Container.get(n8n_core_1.InstanceSettings).nodesDownloadDir, 'node_modules');
        const { nodes } = di_1.Container.get(config_1.GlobalConfig);
        return await (0, n8n_core_1.scanDirectoryForPackages)(dir, {
            excludeNodes: nodes.exclude,
            includeNodes: nodes.include,
        });
    }
};
exports.CommunityPackagesModule = CommunityPackagesModule;
exports.CommunityPackagesModule = CommunityPackagesModule = __decorate([
    (0, decorators_1.BackendModule)({ name: 'community-packages' })
], CommunityPackagesModule);
//# sourceMappingURL=community-packages.module.js.map