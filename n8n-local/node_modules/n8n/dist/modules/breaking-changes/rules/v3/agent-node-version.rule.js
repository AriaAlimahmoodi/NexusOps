"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentNodeVersionRule = void 0;
const decorators_1 = require("@n8n/decorators");
const agent_node_mode_1 = require("./agent-node-mode");
const detection_report_1 = require("../../detection-report");
let AgentNodeVersionRule = class AgentNodeVersionRule {
    constructor() {
        this.id = 'agent-node-version-v3';
    }
    getMetadata() {
        return {
            version: 'v3',
            title: 'AI Agent versions below 2 are removed',
            description: 'AI Agent versions below 2 are removed. After the update, AI Agent nodes that are currently on a version below 2 will run with version 2 behavior, which only supports the Tools Agent.',
            category: "workflow",
            impact: 'behaviorChanges',
        };
    }
    async getRecommendations(_workflowResults) {
        return [
            {
                action: 'Move AI Agent nodes on versions below 2 to the latest version',
                description: 'Replace each affected AI Agent node with an AI Agent on the latest version and reconnect its model, memory and tools, then run the workflow to confirm it still behaves as expected.',
            },
        ];
    }
    async detectWorkflow(_workflow, nodesGroupedByType) {
        const affectedNodes = (0, agent_node_mode_1.getAgentNodesBelowFirstSupportedVersion)(nodesGroupedByType).filter((node) => !(0, agent_node_mode_1.getRemovedAgentMode)(node));
        return (0, detection_report_1.reportAffectedNodes)(affectedNodes, (node) => ({
            title: `Node '${node.name}' uses AI Agent version ${node.typeVersion}`,
            description: 'After the update, this node will run with version 2 behavior.',
            level: 'warning',
        }));
    }
};
exports.AgentNodeVersionRule = AgentNodeVersionRule;
exports.AgentNodeVersionRule = AgentNodeVersionRule = __decorate([
    (0, decorators_1.BreakingChangeRule)({ version: 'v3' })
], AgentNodeVersionRule);
//# sourceMappingURL=agent-node-version.rule.js.map