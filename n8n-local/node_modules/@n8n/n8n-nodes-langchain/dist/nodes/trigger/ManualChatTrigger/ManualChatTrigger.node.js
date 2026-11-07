"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManualChatTrigger = void 0;
const n8n_workflow_1 = require("n8n-workflow");
class ManualChatTrigger {
    constructor() {
        this.description = {
            displayName: 'Manual Chat Trigger',
            name: 'manualChatTrigger',
            icon: 'fa:comments',
            group: ['trigger'],
            version: [1, 1.1],
            description: 'Runs the flow on new manual chat message',
            eventTriggerDescription: '',
            maxNodes: 1,
            hidden: true,
            defaults: {
                name: 'When chat message received',
                color: '#909298',
            },
            codex: {
                categories: ['Core Nodes'],
                resources: {
                    primaryDocumentation: [
                        {
                            url: 'https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-langchain.chattrigger/',
                        },
                    ],
                },
                subcategories: {
                    'Core Nodes': ['Other Trigger Nodes'],
                },
            },
            inputs: [],
            outputs: [n8n_workflow_1.NodeConnectionTypes.Main],
            properties: [
                {
                    displayName: 'This node is where a manual chat workflow execution starts. To make one, go back to the canvas and click ‘Chat’',
                    name: 'notice',
                    type: 'notice',
                    default: '',
                },
                {
                    displayName: 'Chat and execute workflow',
                    name: 'openChat',
                    type: 'button',
                    typeOptions: {
                        buttonConfig: {
                            action: 'openChat',
                        },
                    },
                    default: '',
                },
            ],
        };
    }
    async trigger() {
        const manualTriggerFunction = async () => {
            this.emit([this.helpers.returnJsonArray([{}])]);
        };
        return {
            manualTriggerFunction,
        };
    }
}
exports.ManualChatTrigger = ManualChatTrigger;
//# sourceMappingURL=ManualChatTrigger.node.js.map