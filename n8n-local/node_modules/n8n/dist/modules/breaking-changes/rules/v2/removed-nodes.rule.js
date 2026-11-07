"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemovedNodesRule = void 0;
const decorators_1 = require("@n8n/decorators");
let RemovedNodesRule = class RemovedNodesRule {
    constructor() {
        this.REMOVED_NODES = [
            'n8n-nodes-base.spontit',
            'n8n-nodes-base.crowdDev',
            'n8n-nodes-base.kitemaker',
        ];
        this.id = 'removed-nodes-v2';
    }
    getMetadata() {
        return {
            version: 'v2',
            title: 'Removed Deprecated Nodes',
            description: 'Several deprecated nodes have been removed and will no longer work',
            category: "workflow",
            impact: 'executionsFail',
            documentationUrl: 'https://docs.n8n.io/2-0-breaking-changes/#removed-nodes-for-retired-services',
        };
    }
    async getRecommendations(_workflowResults) {
        return [
            {
                action: 'Update affected workflows',
                description: 'Replace removed nodes with their updated versions or alternatives',
            },
        ];
    }
    async detectWorkflow(_workflow, nodesGroupedByType) {
        const removedNodes = this.REMOVED_NODES.flatMap((type) => nodesGroupedByType.get(type) ?? []);
        if (removedNodes.length === 0)
            return { isAffected: false, issues: [] };
        return {
            isAffected: true,
            issues: removedNodes.map((node) => ({
                title: `Node '${node.type}' with name '${node.name}' has been removed`,
                description: `The node type '${node.type}' is no longer available. Please replace it with an alternative.`,
                level: 'error',
                nodeId: node.id,
                nodeName: node.name,
            })),
        };
    }
};
exports.RemovedNodesRule = RemovedNodesRule;
exports.RemovedNodesRule = RemovedNodesRule = __decorate([
    (0, decorators_1.BreakingChangeRule)({ version: 'v2' })
], RemovedNodesRule);
//# sourceMappingURL=removed-nodes.rule.js.map