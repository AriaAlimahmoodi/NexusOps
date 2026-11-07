"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetPairedItemRule = void 0;
const decorators_1 = require("@n8n/decorators");
const detection_report_1 = require("../../detection-report");
const HELPER_NAME = '$getPairedItem';
let GetPairedItemRule = class GetPairedItemRule {
    constructor() {
        this.id = 'get-paired-item-v3';
    }
    getMetadata() {
        return {
            version: 'v3',
            title: '$getPairedItem expression helper is removed',
            description: 'The $getPairedItem expression helper is removed. Expressions using it will fail to evaluate.',
            category: "workflow",
            impact: 'executionsFail',
        };
    }
    async getRecommendations(_workflowResults) {
        return [
            {
                action: 'Replace $getPairedItem usages',
                description: 'Rewrite the affected expressions using $input.all() or $("Node").all(), $("Node").item, or $("Node").itemMatching() instead of $getPairedItem.',
            },
        ];
    }
    async detectWorkflow(workflow, _nodesGroupedByType) {
        const affectedNodes = workflow.nodes.filter((node) => JSON.stringify(node.parameters ?? {}).includes(HELPER_NAME));
        return (0, detection_report_1.reportAffectedNodes)(affectedNodes, (node) => ({
            title: `Node '${node.name}' uses the removed ${HELPER_NAME} helper`,
            description: `Expressions in this node call ${HELPER_NAME}, which is removed. They will fail to evaluate after the update.`,
            level: 'error',
        }));
    }
};
exports.GetPairedItemRule = GetPairedItemRule;
exports.GetPairedItemRule = GetPairedItemRule = __decorate([
    (0, decorators_1.BreakingChangeRule)({ version: 'v3' })
], GetPairedItemRule);
//# sourceMappingURL=get-paired-item.rule.js.map