"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskRunnerTaskTimeoutRule = void 0;
const decorators_1 = require("@n8n/decorators");
const detection_report_1 = require("../../detection-report");
let TaskRunnerTaskTimeoutRule = class TaskRunnerTaskTimeoutRule {
    constructor() {
        this.id = 'task-runner-task-timeout-v3';
    }
    getMetadata() {
        return {
            version: 'v3',
            title: 'Task runner timeout default is reduced to 1 minute',
            description: 'The default of N8N_RUNNERS_TASK_TIMEOUT is reduced from 300 seconds (5 minutes) to 60 seconds (1 minute). Code node tasks running longer than the new default will be aborted.',
            category: "environment",
            impact: 'executionsFail',
        };
    }
    async detect() {
        if (process.env.N8N_RUNNERS_TASK_TIMEOUT !== undefined) {
            return detection_report_1.NOT_AFFECTED_INSTANCE;
        }
        return {
            isAffected: true,
            instanceIssues: [
                {
                    title: 'Instance relies on the current default task timeout',
                    description: 'N8N_RUNNERS_TASK_TIMEOUT is not set, so this instance uses the default of 300 seconds. After the update, tasks running longer than 60 seconds will be aborted.',
                    level: 'info',
                },
            ],
            recommendations: [
                {
                    action: 'Set N8N_RUNNERS_TASK_TIMEOUT explicitly',
                    description: 'If you have Code nodes that run longer than 1 minute, set N8N_RUNNERS_TASK_TIMEOUT=300 to keep the current timeout.',
                },
            ],
        };
    }
};
exports.TaskRunnerTaskTimeoutRule = TaskRunnerTaskTimeoutRule;
exports.TaskRunnerTaskTimeoutRule = TaskRunnerTaskTimeoutRule = __decorate([
    (0, decorators_1.BreakingChangeRule)({ version: 'v3' })
], TaskRunnerTaskTimeoutRule);
//# sourceMappingURL=task-runner-task-timeout.rule.js.map