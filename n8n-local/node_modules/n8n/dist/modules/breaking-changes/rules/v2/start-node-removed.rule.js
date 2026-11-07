"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StartNodeRemovedRule = void 0;
const decorators_1 = require("@n8n/decorators");
let StartNodeRemovedRule = class StartNodeRemovedRule {
    constructor() {
        this.START_NODE_TYPE = 'n8n-nodes-base.start';
        this.id = 'start-node-removed-v2';
    }
    getMetadata() {
        return {
            version: 'v2',
            title: 'Start node removed',
            description: 'The Start node is no longer supported. Replace it with a Manual Trigger for manual executions, or with an Execute Workflow Trigger if used as a sub-workflow.',
            category: "workflow",
            impact: 'executionsFail',
        };
    }
    async getRecommendations(_workflowResults) {
        return [
            {
                action: 'Replace with Manual Trigger',
                description: 'If the workflow is triggered manually, replace the Start node with the Manual Trigger node.',
            },
            {
                action: 'Replace with Execute Workflow Trigger',
                description: 'If the workflow is called as a sub-workflow, replace the Start node with the Execute Workflow Trigger node and activate the workflow.',
            },
            {
                action: 'Delete disabled Start nodes',
                description: 'If the Start node is disabled, delete it from the workflow.',
            },
        ];
    }
    async detectWorkflow(_workflow, nodesGroupedByType) {
        const startNodes = nodesGroupedByType.get(this.START_NODE_TYPE) ?? [];
        if (startNodes.length === 0)
            return { isAffected: false, issues: [] };
        return {
            isAffected: true,
            issues: startNodes.map((node) => ({
                title: `Start node '${node.name}' is no longer supported`,
                description: node.disabled
                    ? 'Delete this disabled Start node from the workflow.'
                    : 'Replace with Manual Trigger for manual executions, or Execute Workflow Trigger if used as a sub-workflow.',
                level: 'error',
                nodeId: node.id,
                nodeName: node.name,
            })),
        };
    }
};
exports.StartNodeRemovedRule = StartNodeRemovedRule;
exports.StartNodeRemovedRule = StartNodeRemovedRule = __decorate([
    (0, decorators_1.BreakingChangeRule)({ version: 'v2' })
], StartNodeRemovedRule);
//# sourceMappingURL=start-node-removed.rule.js.map