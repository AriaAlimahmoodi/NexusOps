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
exports.DockerOnlyDeploymentRule = void 0;
const decorators_1 = require("@n8n/decorators");
const n8n_core_1 = require("n8n-core");
const detection_report_1 = require("../../detection-report");
let DockerOnlyDeploymentRule = class DockerOnlyDeploymentRule {
    constructor(instanceSettings) {
        this.instanceSettings = instanceSettings;
        this.id = 'docker-only-deployment-v3';
    }
    getMetadata() {
        return {
            version: 'v3',
            title: 'Docker becomes the only supported deployment method',
            description: 'Support for running n8n via npm is removed. The new version must be run via the official Docker image.',
            category: "infrastructure",
            impact: 'upgradeBlocked',
            documentationUrl: 'https://docs.n8n.io/deploy/host-n8n',
        };
    }
    async detect() {
        if (this.instanceSettings.isDocker) {
            return detection_report_1.NOT_AFFECTED_INSTANCE;
        }
        return {
            isAffected: true,
            instanceIssues: [
                {
                    title: 'Instance is not running in a container',
                    description: 'This instance appears to run outside a container (e.g. installed via npm). The new version can only be run via the official Docker image.',
                    level: 'warning',
                },
            ],
            recommendations: [
                {
                    action: 'Migrate to a Docker-based deployment',
                    description: 'Move this instance to the official Docker image before updating, reusing your existing database and encryption key.',
                },
            ],
        };
    }
};
exports.DockerOnlyDeploymentRule = DockerOnlyDeploymentRule;
exports.DockerOnlyDeploymentRule = DockerOnlyDeploymentRule = __decorate([
    (0, decorators_1.BreakingChangeRule)({ version: 'v3' }),
    __metadata("design:paramtypes", [n8n_core_1.InstanceSettings])
], DockerOnlyDeploymentRule);
//# sourceMappingURL=docker-only-deployment.rule.js.map