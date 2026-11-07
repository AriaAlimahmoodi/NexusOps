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
exports.SettingsFilePermissionsRule = void 0;
const config_1 = require("@n8n/config");
const decorators_1 = require("@n8n/decorators");
let SettingsFilePermissionsRule = class SettingsFilePermissionsRule {
    constructor(globalConfig) {
        this.globalConfig = globalConfig;
        this.id = 'settings-file-permissions-v2';
    }
    getMetadata() {
        return {
            version: 'v2',
            title: 'Enforce settings file permissions',
            description: 'n8n now enforces stricter permissions on configuration files for improved security',
            category: "infrastructure",
            impact: 'behaviorChanges',
            documentationUrl: 'https://docs.n8n.io/2-0-breaking-changes/#enforce-settings-file-permissions',
        };
    }
    async detect() {
        if (this.globalConfig.deployment.type === 'cloud') {
            return {
                isAffected: false,
                instanceIssues: [],
                recommendations: [],
            };
        }
        if (process.env.N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS) {
            return {
                isAffected: false,
                instanceIssues: [],
                recommendations: [],
            };
        }
        const result = {
            isAffected: true,
            instanceIssues: [
                {
                    title: 'Settings file permissions will be enforced',
                    description: 'n8n will now enforce chmod 600 permissions on configuration files. This may affect Docker/Kubernetes setups with volume mounts.',
                    level: 'warning',
                },
            ],
            recommendations: [
                {
                    action: 'Configure volume permissions',
                    description: 'If using Docker or Kubernetes with volume mounts for .n8n directory, ensure the mounted volume has proper ownership and chmod 600 can be enforced on the config file',
                },
                {
                    action: 'Disable enforcement if needed',
                    description: 'Set N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=false to disable permission enforcement',
                },
                {
                    action: 'Separate configs for multi-instance setups',
                    description: 'In multi-main or queue setups, give each instance its own .n8n directory or use N8N_ENCRYPTION_KEY environment variable instead of relying on the config file',
                },
            ],
        };
        return result;
    }
};
exports.SettingsFilePermissionsRule = SettingsFilePermissionsRule;
exports.SettingsFilePermissionsRule = SettingsFilePermissionsRule = __decorate([
    (0, decorators_1.BreakingChangeRule)({ version: 'v2' }),
    __metadata("design:paramtypes", [config_1.GlobalConfig])
], SettingsFilePermissionsRule);
//# sourceMappingURL=settings-file-permissions.rule.js.map