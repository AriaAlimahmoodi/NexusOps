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
exports.UnverifiedPackagesRule = exports.CommunityPackagesEnabledConfig = void 0;
const config_1 = require("@n8n/config");
const decorators_1 = require("@n8n/decorators");
const detection_report_1 = require("../../detection-report");
let CommunityPackagesEnabledConfig = class CommunityPackagesEnabledConfig {
    constructor() {
        this.enabled = true;
        this.disabledModules = [];
    }
    sanitize() {
        if (this.disabledModules.includes('community-packages')) {
            this.enabled = false;
        }
    }
};
exports.CommunityPackagesEnabledConfig = CommunityPackagesEnabledConfig;
__decorate([
    (0, config_1.Env)('N8N_COMMUNITY_PACKAGES_ENABLED'),
    __metadata("design:type", Boolean)
], CommunityPackagesEnabledConfig.prototype, "enabled", void 0);
__decorate([
    (0, config_1.Env)('N8N_DISABLED_MODULES'),
    __metadata("design:type", config_1.CommaSeparatedStringArray)
], CommunityPackagesEnabledConfig.prototype, "disabledModules", void 0);
exports.CommunityPackagesEnabledConfig = CommunityPackagesEnabledConfig = __decorate([
    config_1.Config
], CommunityPackagesEnabledConfig);
let UnverifiedPackagesRule = class UnverifiedPackagesRule {
    constructor(communityPackagesConfig) {
        this.communityPackagesConfig = communityPackagesConfig;
        this.id = 'unverified-packages-v3';
    }
    getMetadata() {
        return {
            version: 'v3',
            title: 'Unverified community packages are disabled by default',
            description: 'The default of N8N_UNVERIFIED_PACKAGES_ENABLED changes to false. Installed community packages that are not verified by n8n will stop loading unless the variable is explicitly set to true.',
            category: "environment",
            impact: 'behaviorChanges',
        };
    }
    async detect() {
        const isAffected = this.communityPackagesConfig.enabled &&
            process.env.N8N_UNVERIFIED_PACKAGES_ENABLED === undefined;
        if (!isAffected)
            return detection_report_1.NOT_AFFECTED_INSTANCE;
        return {
            isAffected: true,
            instanceIssues: [
                {
                    title: 'Instance relies on the current default for unverified packages',
                    description: 'N8N_UNVERIFIED_PACKAGES_ENABLED is not set, so this instance currently allows unverified community packages. After the update, workflows using nodes from unverified packages will fail to load them.',
                    level: 'warning',
                },
            ],
            recommendations: [
                {
                    action: 'Set N8N_UNVERIFIED_PACKAGES_ENABLED explicitly',
                    description: 'Review your installed community packages. If any are unverified and you want to keep using them, set N8N_UNVERIFIED_PACKAGES_ENABLED=true before updating.',
                },
            ],
        };
    }
};
exports.UnverifiedPackagesRule = UnverifiedPackagesRule;
exports.UnverifiedPackagesRule = UnverifiedPackagesRule = __decorate([
    (0, decorators_1.BreakingChangeRule)({ version: 'v3' }),
    __metadata("design:paramtypes", [CommunityPackagesEnabledConfig])
], UnverifiedPackagesRule);
//# sourceMappingURL=unverified-packages.rule.js.map