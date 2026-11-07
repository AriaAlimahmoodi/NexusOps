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
exports.OffloadManualExecutionsRule = void 0;
const config_1 = require("@n8n/config");
const decorators_1 = require("@n8n/decorators");
const detection_report_1 = require("../../detection-report");
let OffloadManualExecutionsRule = class OffloadManualExecutionsRule {
    constructor(executionsConfig) {
        this.executionsConfig = executionsConfig;
        this.id = 'offload-manual-executions-v3';
    }
    getMetadata() {
        return {
            version: 'v3',
            title: 'Manual executions always run on workers in queue mode',
            description: 'In queue mode, manual executions are always routed to workers. The OFFLOAD_MANUAL_EXECUTIONS_TO_WORKERS environment variable is removed and running manual executions on the main instance is no longer possible.',
            category: "instance",
            impact: 'behaviorChanges',
        };
    }
    async detect() {
        const isAffected = this.executionsConfig.mode === 'queue' &&
            process.env.OFFLOAD_MANUAL_EXECUTIONS_TO_WORKERS !== 'true';
        if (!isAffected)
            return detection_report_1.NOT_AFFECTED_INSTANCE;
        return {
            isAffected: true,
            instanceIssues: [
                {
                    title: 'Manual executions currently run on the main instance',
                    description: 'This instance runs in queue mode without offloading manual executions to workers. After the update, all manual executions run on workers, which changes where their load lands.',
                    level: 'warning',
                },
            ],
            recommendations: [
                {
                    action: 'Enable offloading before updating',
                    description: 'Set OFFLOAD_MANUAL_EXECUTIONS_TO_WORKERS=true to adopt the new behavior early. Consider increasing memory available to workers and reducing memory available to main.',
                },
            ],
        };
    }
};
exports.OffloadManualExecutionsRule = OffloadManualExecutionsRule;
exports.OffloadManualExecutionsRule = OffloadManualExecutionsRule = __decorate([
    (0, decorators_1.BreakingChangeRule)({ version: 'v3' }),
    __metadata("design:paramtypes", [config_1.ExecutionsConfig])
], OffloadManualExecutionsRule);
//# sourceMappingURL=offload-manual-executions.rule.js.map