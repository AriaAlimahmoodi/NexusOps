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
exports.StoragePathRenameRule = void 0;
const decorators_1 = require("@n8n/decorators");
const n8n_core_1 = require("n8n-core");
const node_fs_1 = require("node:fs");
const node_path_1 = __importDefault(require("node:path"));
let StoragePathRenameRule = class StoragePathRenameRule {
    constructor(instanceSettings) {
        this.instanceSettings = instanceSettings;
        this.id = 'storage-path-rename-v3';
    }
    getMetadata() {
        return {
            version: 'v3',
            title: 'Filesystem storage directory is renamed',
            description: 'The filesystem storage directory `~/.n8n/binaryData` is renamed to `~/.n8n/storage` on the first start of the new version.',
            category: "infrastructure",
            impact: 'behaviorChanges',
        };
    }
    async detect() {
        const notAffected = { isAffected: false, instanceIssues: [], recommendations: [] };
        if (this.instanceSettings.fsStorageMigrated)
            return notAffected;
        if (process.env.N8N_STORAGE_PATH || process.env.N8N_BINARY_DATA_STORAGE_PATH) {
            return notAffected;
        }
        const { n8nFolder } = this.instanceSettings;
        const oldPath = node_path_1.default.join(n8nFolder, 'binaryData');
        const newPath = node_path_1.default.join(n8nFolder, 'storage');
        if (!(0, node_fs_1.existsSync)(oldPath))
            return notAffected;
        if ((0, node_fs_1.existsSync)(newPath)) {
            return {
                isAffected: true,
                instanceIssues: [
                    {
                        title: 'Both storage directories exist',
                        description: `Both "${oldPath}" and "${newPath}" exist. The new version cannot rename "${oldPath}" and fails to start.`,
                        level: 'error',
                    },
                ],
                recommendations: [
                    {
                        action: 'Resolve the directory conflict',
                        description: `Before you update, move the contents of "${oldPath}" into "${newPath}" and remove "${oldPath}", or set N8N_STORAGE_PATH to the directory you want to use.`,
                    },
                ],
            };
        }
        return {
            isAffected: true,
            instanceIssues: [
                {
                    title: 'Storage directory will be renamed',
                    description: `"${oldPath}" is renamed to "${newPath}" on the first start of the new version.`,
                    level: 'warning',
                },
            ],
            recommendations: [
                {
                    action: 'Update volume mounts',
                    description: `If you mount a volume at "${oldPath}", mount it at "${newPath}" instead, or set N8N_STORAGE_PATH to the old path to keep it.`,
                },
            ],
        };
    }
};
exports.StoragePathRenameRule = StoragePathRenameRule;
exports.StoragePathRenameRule = StoragePathRenameRule = __decorate([
    (0, decorators_1.BreakingChangeRule)({ version: 'v3' }),
    __metadata("design:paramtypes", [n8n_core_1.InstanceSettings])
], StoragePathRenameRule);
//# sourceMappingURL=storage-path-rename.rule.js.map