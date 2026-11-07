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
exports.BinaryDataStorageRule = void 0;
const config_1 = require("@n8n/config");
const decorators_1 = require("@n8n/decorators");
const n8n_core_1 = require("n8n-core");
let BinaryDataStorageRule = class BinaryDataStorageRule {
    constructor(config, executionsConfig) {
        this.config = config;
        this.executionsConfig = executionsConfig;
        this.id = 'binary-data-storage-v2';
    }
    getMetadata() {
        return {
            version: 'v2',
            title: 'Binary data in-memory mode is removed',
            description: 'Binary files are now stored on disk (default in regular mode) or in database (default in queue mode) instead of in memory',
            category: "infrastructure",
            impact: 'behaviorChanges',
            documentationUrl: 'https://docs.n8n.io/2-0-breaking-changes/#remove-in-memory-binary-data-mode',
        };
    }
    async detect() {
        if (this.config.mode !== 'default') {
            return {
                isAffected: false,
                instanceIssues: [],
                recommendations: [],
            };
        }
        const isRegularMode = this.executionsConfig.mode === 'regular';
        const result = {
            isAffected: true,
            instanceIssues: [
                {
                    title: 'Binary data storage mode changed',
                    description: isRegularMode
                        ? `Binary files are now stored in ${this.config.localStoragePath} directory by default (for regular mode) instead of in memory.`
                        : 'Binary files are now stored in the database by default (for queue mode) instead of in memory.',
                    level: 'info',
                },
            ],
            recommendations: isRegularMode
                ? [
                    {
                        action: 'Ensure adequate disk space',
                        description: `Verify sufficient disk space is available for binary file storage in the ${this.config.localStoragePath} directory`,
                    },
                    {
                        action: 'Configure persistent storage',
                        description: 'If using containers, ensure the binary data directory is mounted on a persistent volume',
                    },
                    {
                        action: 'Include in backups',
                        description: 'Add the binary data folder to your backup procedures',
                    },
                ]
                : [],
        };
        return result;
    }
};
exports.BinaryDataStorageRule = BinaryDataStorageRule;
exports.BinaryDataStorageRule = BinaryDataStorageRule = __decorate([
    (0, decorators_1.BreakingChangeRule)({ version: 'v2' }),
    __metadata("design:paramtypes", [n8n_core_1.BinaryDataConfig, config_1.ExecutionsConfig])
], BinaryDataStorageRule);
//# sourceMappingURL=binary-data-storage.rule.js.map