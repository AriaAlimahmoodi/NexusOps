"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DotenvUpgradeRule = void 0;
const decorators_1 = require("@n8n/decorators");
const node_fs_1 = require("node:fs");
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
let DotenvUpgradeRule = class DotenvUpgradeRule {
    constructor() {
        this.id = 'dotenv-upgrade-v2';
    }
    getMetadata() {
        return {
            version: 'v2',
            title: 'Upgrade dotenv',
            description: 'The dotenv library has been upgraded, which may affect how .env files are parsed',
            category: "environment",
            impact: 'behaviorChanges',
            documentationUrl: 'https://docs.n8n.io/2-0-breaking-changes/#upgrade-dotenv',
        };
    }
    async fileExists(path) {
        try {
            await (0, promises_1.access)(path, node_fs_1.constants.F_OK);
            return true;
        }
        catch {
            return false;
        }
    }
    async detect() {
        const result = {
            isAffected: false,
            instanceIssues: [],
            recommendations: [],
        };
        const possibleEnvPaths = [
            (0, node_path_1.join)(process.cwd(), '.env'),
            (0, node_path_1.join)(process.cwd(), '.env.local'),
            (0, node_path_1.join)(process.cwd(), '.env.development'),
            (0, node_path_1.join)(process.cwd(), '.env.production'),
        ];
        const existsChecks = await Promise.all(possibleEnvPaths.map(async (path) => ({
            path,
            exists: await this.fileExists(path),
        })));
        const existingEnvFiles = existsChecks.filter((check) => check.exists);
        if (existingEnvFiles.length === 0) {
            return result;
        }
        result.isAffected = true;
        result.instanceIssues.push({
            title: 'dotenv library upgrade detected',
            description: 'The dotenv library has been upgraded, which changes how values containing # or newlines are parsed. This may affect .env file parsing.',
            level: 'warning',
        });
        result.recommendations.push({
            action: 'Review .env files',
            description: 'Ensure any values containing # or newlines are quoted appropriately. Avoid ambiguous unquoted usages that might now be interpreted differently.',
        });
        return result;
    }
};
exports.DotenvUpgradeRule = DotenvUpgradeRule;
exports.DotenvUpgradeRule = DotenvUpgradeRule = __decorate([
    (0, decorators_1.BreakingChangeRule)({ version: 'v2' })
], DotenvUpgradeRule);
//# sourceMappingURL=dotenv-upgrade.rule.js.map