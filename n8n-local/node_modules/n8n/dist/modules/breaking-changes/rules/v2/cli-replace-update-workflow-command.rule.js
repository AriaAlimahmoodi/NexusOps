"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CliActivateAllWorkflowsRule = void 0;
const decorators_1 = require("@n8n/decorators");
let CliActivateAllWorkflowsRule = class CliActivateAllWorkflowsRule {
    constructor() {
        this.id = 'cli-activate-all-workflows-v2';
    }
    getMetadata() {
        return {
            version: 'v2',
            title: 'CLI command update:workflow replaced',
            description: 'The CLI command update:workflow has been replaced with publish:workflow and unpublish:workflow for better clarity.',
            category: "instance",
            impact: 'capabilityRemoved',
            documentationUrl: 'https://docs.n8n.io/2-0-breaking-changes/#replace-cli-command-updateworkflow',
        };
    }
    async detect() {
        const result = {
            isAffected: true,
            instanceIssues: [
                {
                    title: 'CLI command update:workflow replaced',
                    description: 'The CLI command update:workflow has been replaced with publish:workflow and unpublish:workflow. If you were using this command in scripts or automation, you will need to update your approach.',
                    level: 'info',
                },
            ],
            recommendations: [
                {
                    action: 'Use the API to activate workflows',
                    description: 'Update automation scripts to use the public API to activate workflows individually instead of the CLI command',
                },
                {
                    action: 'Review deployment scripts',
                    description: 'Check any deployment or automation scripts that may have used the CLI command to activate all workflows and update them accordingly',
                },
            ],
        };
        return result;
    }
};
exports.CliActivateAllWorkflowsRule = CliActivateAllWorkflowsRule;
exports.CliActivateAllWorkflowsRule = CliActivateAllWorkflowsRule = __decorate([
    (0, decorators_1.BreakingChangeRule)({ version: 'v2' })
], CliActivateAllWorkflowsRule);
//# sourceMappingURL=cli-replace-update-workflow-command.rule.js.map