"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentRemovedModesRule = void 0;
const decorators_1 = require("@n8n/decorators");
const agent_node_mode_1 = require("./agent-node-mode");
const detection_report_1 = require("../../detection-report");
let AgentRemovedModesRule = class AgentRemovedModesRule {
    constructor() {
        this.id = 'agent-removed-modes-v3';
    }
    getMetadata() {
        return {
            version: 'v3',
            title: 'Deprecated AI Agent modes removed',
            description: 'AI Agent versions below 2 are removed, and with them the Conversational, OpenAI Functions, Plan and Execute, ReAct and SQL Agent modes, which version 2 does not offer. After the update, nodes set to one of these modes will fail when executed.',
            category: "workflow",
            impact: 'executionsFail',
        };
    }
    async getRecommendations(_workflowResults) {
        return [
            {
                action: 'Rebuild AI Agent nodes that use a removed mode',
                description: 'Replace each affected AI Agent node with an AI Agent on the latest version and reconnect its model, memory and tools. Nodes that used the SQL Agent mode also need a database tool connected to keep querying their database.',
            },
        ];
    }
    async detectWorkflow(_workflow, nodesGroupedByType) {
        const affectedNodes = (0, agent_node_mode_1.getAgentNodesBelowFirstSupportedVersion)(nodesGroupedByType).flatMap((node) => {
            const removedMode = (0, agent_node_mode_1.getRemovedAgentMode)(node);
            return removedMode ? [{ ...node, removedMode }] : [];
        });
        return (0, detection_report_1.reportAffectedNodes)(affectedNodes, ({ name, typeVersion, removedMode }) => ({
            title: `Node '${name}' uses the "${removedMode}" mode of AI Agent version ${typeVersion}`,
            description: `The "${removedMode}" mode is no longer available. After the update, this node will fail when executed until it is replaced with an AI Agent on the latest version.`,
            level: 'error',
        }));
    }
};
exports.AgentRemovedModesRule = AgentRemovedModesRule;
exports.AgentRemovedModesRule = AgentRemovedModesRule = __decorate([
    (0, decorators_1.BreakingChangeRule)({ version: 'v3' })
], AgentRemovedModesRule);
//# sourceMappingURL=agent-removed-modes.rule.js.map