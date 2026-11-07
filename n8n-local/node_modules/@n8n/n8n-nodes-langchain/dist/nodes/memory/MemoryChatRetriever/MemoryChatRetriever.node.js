"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryChatRetriever = void 0;
const n8n_workflow_1 = require("n8n-workflow");
function simplifyMessages(messages) {
    const chunkedMessages = [];
    for (let i = 0; i < messages.length; i += 2) {
        chunkedMessages.push([messages[i], messages[i + 1]]);
    }
    const transformedMessages = chunkedMessages.map((exchange) => {
        const simplified = {
            [exchange[0]._getType()]: exchange[0].content,
        };
        if (exchange[1]) {
            simplified[exchange[1]._getType()] = exchange[1].content;
        }
        return {
            json: simplified,
        };
    });
    return transformedMessages;
}
class MemoryChatRetriever {
    constructor() {
        this.description = {
            displayName: 'Chat Messages Retriever',
            name: 'memoryChatRetriever',
            icon: 'fa:database',
            iconColor: 'black',
            group: ['transform'],
            hidden: true,
            version: 1,
            description: 'Retrieve chat messages from memory and use them in the workflow',
            defaults: {
                name: 'Chat Messages Retriever',
            },
            codex: {
                categories: ['AI'],
                subcategories: {
                    AI: ['Miscellaneous'],
                },
                resources: {
                    primaryDocumentation: [
                        {
                            url: 'https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.memorymanager/',
                        },
                    ],
                },
            },
            inputs: [
                n8n_workflow_1.NodeConnectionTypes.Main,
                {
                    displayName: 'Memory',
                    maxConnections: 1,
                    type: n8n_workflow_1.NodeConnectionTypes.AiMemory,
                    required: true,
                },
            ],
            outputs: [n8n_workflow_1.NodeConnectionTypes.Main],
            properties: [
                {
                    displayName: "This node is deprecated. Use 'Chat Memory Manager' node instead.",
                    type: 'notice',
                    default: '',
                    name: 'deprecatedNotice',
                },
                {
                    displayName: 'Simplify Output',
                    name: 'simplifyOutput',
                    type: 'boolean',
                    description: 'Whether to simplify the output to only include the sender and the text',
                    default: true,
                },
            ],
        };
    }
    async execute() {
        this.logger.debug('Executing Chat Memory Retriever');
        const memory = (await this.getInputConnectionData(n8n_workflow_1.NodeConnectionTypes.AiMemory, 0));
        const simplifyOutput = this.getNodeParameter('simplifyOutput', 0);
        const messages = await memory?.chatHistory.getMessages();
        if (simplifyOutput && messages) {
            return [simplifyMessages(messages)];
        }
        const serializedMessages = messages?.map((message) => {
            const serializedMessage = message.toJSON();
            return { json: serializedMessage };
        }) ?? [];
        return [serializedMessages];
    }
}
exports.MemoryChatRetriever = MemoryChatRetriever;
//# sourceMappingURL=MemoryChatRetriever.node.js.map