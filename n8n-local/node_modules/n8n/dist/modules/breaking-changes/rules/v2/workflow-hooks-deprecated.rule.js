"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowHooksDeprecatedRule = void 0;
const decorators_1 = require("@n8n/decorators");
let WorkflowHooksDeprecatedRule = class WorkflowHooksDeprecatedRule {
    constructor() {
        this.id = 'workflow-hooks-deprecated-v2';
    }
    getMetadata() {
        return {
            version: 'v2',
            title: 'Deprecated frontend workflow hooks',
            description: 'The hooks workflow.activeChange and workflow.activeChangeCurrent are deprecated and replaced by workflow.published',
            category: "instance",
            impact: 'capabilityRemoved',
            documentationUrl: 'https://docs.n8n.io/2-0-breaking-changes/#deprecated-frontend-workflow-hooks',
        };
    }
    async detect() {
        const result = {
            isAffected: true,
            instanceIssues: [
                {
                    title: 'Workflow hooks workflow.activeChange and workflow.activeChangeCurrent deprecated',
                    description: 'The workflow.activeChange and workflow.activeChangeCurrent hooks are deprecated and will be removed. These hooks are being replaced by a new workflow.published hook that provides more consistent behavior and is triggered when any version of a workflow is published.',
                    level: 'warning',
                },
            ],
            recommendations: [
                {
                    action: 'Replace workflow.activeChange with workflow.published',
                    description: 'Update your code to use the new workflow.published hook instead of workflow.activeChange. The new hook will be triggered whenever a workflow version is published.',
                },
                {
                    action: 'Replace workflow.activeChangeCurrent with workflow.published',
                    description: 'Update your code to use the new workflow.published hook instead of workflow.activeChangeCurrent. This provides more consistent behavior across workflow publishing actions.',
                },
                {
                    action: 'Review custom integrations and extensions',
                    description: 'Check any custom integrations, plugins, or extensions that may be using the deprecated workflow hooks and update them to use workflow.published.',
                },
            ],
        };
        return result;
    }
};
exports.WorkflowHooksDeprecatedRule = WorkflowHooksDeprecatedRule;
exports.WorkflowHooksDeprecatedRule = WorkflowHooksDeprecatedRule = __decorate([
    (0, decorators_1.BreakingChangeRule)({ version: 'v2' })
], WorkflowHooksDeprecatedRule);
//# sourceMappingURL=workflow-hooks-deprecated.rule.js.map