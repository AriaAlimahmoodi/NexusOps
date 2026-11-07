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
exports.PromotionWorkingDirectoryService = void 0;
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const promises_1 = require("node:fs/promises");
const node_path_1 = __importDefault(require("node:path"));
const SAFE_ID = /^[0-9A-Za-z]{1,36}$/;
const DESCRIPTOR_FILE = 'cache.json';
let PromotionWorkingDirectoryService = class PromotionWorkingDirectoryService {
    constructor(instanceSettings) {
        this.instanceSettings = instanceSettings;
    }
    paths(configId) {
        if (!SAFE_ID.test(configId)) {
            throw new n8n_workflow_1.UnexpectedError('Promotion config ID is not a generated ID');
        }
        const rootFolder = node_path_1.default.join(this.instanceSettings.n8nFolder, 'promotions', 'configs', configId);
        return {
            rootFolder,
            repositoryFolder: node_path_1.default.join(rootFolder, 'repository'),
            nextRepositoryFolder: node_path_1.default.join(rootFolder, 'repository-next'),
            sshDir: node_path_1.default.join(rootFolder, '.ssh'),
            descriptorFile: node_path_1.default.join(rootFolder, DESCRIPTOR_FILE),
        };
    }
    async writeDescriptor(descriptor) {
        const { rootFolder, descriptorFile } = this.paths(descriptor.configId);
        await (0, promises_1.mkdir)(rootFolder, { recursive: true });
        await (0, promises_1.writeFile)(descriptorFile, JSON.stringify(descriptor), 'utf8');
    }
    async readDescriptor(configId) {
        const { descriptorFile } = this.paths(configId);
        try {
            const raw = await (0, promises_1.readFile)(descriptorFile, 'utf8');
            return (0, n8n_workflow_1.jsonParse)(raw, { fallbackValue: undefined }) ?? null;
        }
        catch {
            return null;
        }
    }
    async matchesDescriptor(expected) {
        const stored = await this.readDescriptor(expected.configId);
        if (!stored)
            return false;
        return (stored.schemaVersion === expected.schemaVersion &&
            stored.connectionId === expected.connectionId &&
            stored.remoteUrl === expected.remoteUrl &&
            stored.checkoutBranchName === expected.checkoutBranchName);
    }
    async invalidateDescriptor(configId) {
        await (0, promises_1.rm)(this.paths(configId).descriptorFile, { force: true });
    }
    async resetCheckout(configId) {
        const { repositoryFolder, nextRepositoryFolder, descriptorFile } = this.paths(configId);
        await (0, promises_1.rm)(repositoryFolder, { recursive: true, force: true });
        await (0, promises_1.rm)(nextRepositoryFolder, { recursive: true, force: true });
        await (0, promises_1.rm)(descriptorFile, { force: true });
    }
    async purge(configId) {
        await (0, promises_1.rm)(this.paths(configId).rootFolder, { recursive: true, force: true });
    }
};
exports.PromotionWorkingDirectoryService = PromotionWorkingDirectoryService;
exports.PromotionWorkingDirectoryService = PromotionWorkingDirectoryService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [n8n_core_1.InstanceSettings])
], PromotionWorkingDirectoryService);
//# sourceMappingURL=promotion-working-directory.service.js.map