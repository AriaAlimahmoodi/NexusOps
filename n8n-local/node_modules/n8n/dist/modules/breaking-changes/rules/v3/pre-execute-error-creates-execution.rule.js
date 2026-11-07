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
exports.PreExecuteErrorCreatesExecutionRule = void 0;
const config_1 = require("@n8n/config");
const decorators_1 = require("@n8n/decorators");
const detection_report_1 = require("../../detection-report");
let PreExecuteErrorCreatesExecutionRule = class PreExecuteErrorCreatesExecutionRule {
    constructor(executionsConfig) {
        this.executionsConfig = executionsConfig;
        this.id = 'pre-execute-error-creates-execution-v3';
    }
    getMetadata() {
        return {
            version: 'v3',
            title: 'A throw from workflow.preExecute no longer creates an execution',
            description: 'The N8N_PRE_EXECUTE_ERROR_CREATES_EXECUTION environment variable is removed. A throw from workflow.preExecute never creates an execution record.',
            category: "instance",
            impact: 'capabilityRemoved',
        };
    }
    async detect() {
        if (!this.executionsConfig.preExecuteErrorCreatesExecution) {
            return detection_report_1.NOT_AFFECTED_INSTANCE;
        }
        return {
            isAffected: true,
            instanceIssues: [
                {
                    title: 'Instance uses the legacy persist-then-fail path',
                    description: 'This instance sets N8N_PRE_EXECUTE_ERROR_CREATES_EXECUTION so a throw from workflow.preExecute still creates a failed execution. After the update, that throw never creates a row and does not count toward Insights or license usage.',
                    level: 'warning',
                },
            ],
            recommendations: [
                {
                    action: 'Remove N8N_PRE_EXECUTE_ERROR_CREATES_EXECUTION',
                    description: 'Remove the variable before you update. A throw from workflow.preExecute will no longer create an execution.',
                },
            ],
        };
    }
};
exports.PreExecuteErrorCreatesExecutionRule = PreExecuteErrorCreatesExecutionRule;
exports.PreExecuteErrorCreatesExecutionRule = PreExecuteErrorCreatesExecutionRule = __decorate([
    (0, decorators_1.BreakingChangeRule)({ version: 'v3' }),
    __metadata("design:paramtypes", [config_1.ExecutionsConfig])
], PreExecuteErrorCreatesExecutionRule);
//# sourceMappingURL=pre-execute-error-creates-execution.rule.js.map