"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecuteWorkflowSourceModesRule = void 0;
const decorators_1 = require("@n8n/decorators");
const detection_report_1 = require("../../detection-report");
const EXECUTE_WORKFLOW_NODE_TYPE = 'n8n-nodes-base.executeWorkflow';
const REMOVED_SOURCES = ['localFile', 'url'];
const SOURCE_LABELS = {
    localFile: 'Local File',
    url: 'URL',
};
let ExecuteWorkflowSourceModesRule = class ExecuteWorkflowSourceModesRule {
    constructor() {
        this.id = 'execute-workflow-source-modes-v3';
    }
    getMetadata() {
        return {
            version: 'v3',
            title: 'Execute Sub-workflow "Local File" and "URL" sources removed',
            description: 'The "Local File" and "URL" sources of the Execute Sub-workflow node are being removed. Sub-workflows must be loaded from the database or defined in the node parameters.',
            category: "workflow",
            impact: 'executionsFail',
        };
    }
    async getRecommendations(_workflowResults) {
        return [
            {
                action: 'Switch to the "Database" source',
                description: 'Import the referenced workflow into this n8n instance and select it via the "Database" source on the flagged Execute Sub-workflow node.',
            },
            {
                action: 'Or define the workflow JSON in the node',
                description: 'Paste the referenced workflow\'s JSON into the "Parameter" source to keep the sub-workflow definition inside the node.',
            },
        ];
    }
    async detectWorkflow(_workflow, nodesGroupedByType) {
        const affectedNodes = (nodesGroupedByType.get(EXECUTE_WORKFLOW_NODE_TYPE) ?? []).filter((node) => REMOVED_SOURCES.includes(node.parameters.source));
        return (0, detection_report_1.reportAffectedNodes)(affectedNodes, (node) => ({
            title: `Node '${node.name}' uses the removed "${SOURCE_LABELS[node.parameters.source]}" source`,
            description: 'This source is being removed. Import the referenced workflow into this n8n instance and use the "Database" source, or paste its JSON into the "Parameter" source.',
            level: 'error',
        }));
    }
};
exports.ExecuteWorkflowSourceModesRule = ExecuteWorkflowSourceModesRule;
exports.ExecuteWorkflowSourceModesRule = ExecuteWorkflowSourceModesRule = __decorate([
    (0, decorators_1.BreakingChangeRule)({ version: 'v3' })
], ExecuteWorkflowSourceModesRule);
//# sourceMappingURL=execute-workflow-source-modes.rule.js.map