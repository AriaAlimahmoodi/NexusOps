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
exports.TaskRunnerDockerImageRule = void 0;
const config_1 = require("@n8n/config");
const decorators_1 = require("@n8n/decorators");
let TaskRunnerDockerImageRule = class TaskRunnerDockerImageRule {
    constructor(globalConfig) {
        this.globalConfig = globalConfig;
        this.id = 'task-runner-docker-image-v2';
    }
    getMetadata() {
        return {
            version: 'v2',
            title: 'Remove task runner from n8nio/n8n docker image',
            description: 'Task runners are no longer included in the n8nio/n8n docker image and must use the separate n8nio/runners image',
            category: "infrastructure",
            impact: 'executionsFail',
            documentationUrl: 'https://docs.n8n.io/2-0-breaking-changes/#remove-task-runner-from-n8nion8n-docker-image',
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
        const result = {
            isAffected: true,
            instanceIssues: [
                {
                    title: 'Task runner removed from main Docker image',
                    description: 'The task runner is no longer bundled with the n8nio/n8n Docker image. If you are using task runners in Docker, you must use the separate n8nio/runners image.',
                    level: 'warning',
                },
            ],
            recommendations: [
                {
                    action: 'Update Docker configuration',
                    description: 'Change the task runner Docker image from n8nio/n8n to n8nio/runners in your docker-compose.yml or Kubernetes configuration',
                },
                {
                    action: 'Configure external task runners',
                    description: 'Set up external task runners using the n8nio/runners image and configure n8n to connect to them using N8N_RUNNERS_MODE=external',
                },
                {
                    action: 'Review task runner documentation',
                    description: 'Consult the updated task runner documentation for migration steps and configuration examples',
                },
            ],
        };
        return result;
    }
};
exports.TaskRunnerDockerImageRule = TaskRunnerDockerImageRule;
exports.TaskRunnerDockerImageRule = TaskRunnerDockerImageRule = __decorate([
    (0, decorators_1.BreakingChangeRule)({ version: 'v2' }),
    __metadata("design:paramtypes", [config_1.GlobalConfig])
], TaskRunnerDockerImageRule);
//# sourceMappingURL=task-runner-docker-image.rule.js.map