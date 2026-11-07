"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentTool = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const AgentToolV2_node_1 = require("./V2/AgentToolV2.node");
const AgentToolV3_node_1 = require("./V3/AgentToolV3.node");
class AgentTool extends n8n_workflow_1.VersionedNodeType {
    constructor() {
        const baseDescription = {
            displayName: 'AI Agent Tool',
            name: 'agentTool',
            icon: 'fa:robot',
            iconColor: 'black',
            group: ['transform'],
            description: 'Generates an action plan and executes it. Can use external tools.',
            codex: {
                alias: ['LangChain', 'Chat', 'Conversational', 'Plan and Execute', 'ReAct', 'Tools'],
                categories: ['AI'],
                subcategories: {
                    AI: ['Tools'],
                    Tools: ['Recommended Tools'],
                },
            },
            defaultVersion: 3,
        };
        const nodeVersions = {
            2.2: new AgentToolV2_node_1.AgentToolV2(baseDescription),
            3: new AgentToolV3_node_1.AgentToolV3(baseDescription),
        };
        super(nodeVersions, baseDescription);
    }
}
exports.AgentTool = AgentTool;
//# sourceMappingURL=AgentTool.node.js.map