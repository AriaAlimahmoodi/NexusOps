"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VectorStoreInMemoryLoad = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const ai_utilities_1 = require("@n8n/ai-utilities");
class VectorStoreInMemoryLoad {
    constructor() {
        this.description = {
            displayName: 'In Memory Vector Store Load',
            name: 'vectorStoreInMemoryLoad',
            icon: 'fa:database',
            group: ['transform'],
            version: 1,
            hidden: true,
            description: 'Load embedded data from an in-memory vector store',
            defaults: {
                name: 'In Memory Vector Store Load',
            },
            codex: {
                categories: ['AI'],
                subcategories: {
                    AI: ['Vector Stores'],
                },
                resources: {
                    primaryDocumentation: [
                        {
                            url: 'https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.vectorstoreinmemory/',
                        },
                    ],
                },
            },
            inputs: [
                {
                    displayName: 'Embedding',
                    maxConnections: 1,
                    type: n8n_workflow_1.NodeConnectionTypes.AiEmbedding,
                    required: true,
                },
            ],
            outputs: [n8n_workflow_1.NodeConnectionTypes.AiVectorStore],
            outputNames: ['Vector Store'],
            properties: [
                {
                    displayName: 'Memory Key',
                    name: 'memoryKey',
                    type: 'string',
                    default: 'vector_store_key',
                    description: 'The key to use to store the vector memory in the workflow data. The key will be prefixed with the workflow ID to avoid collisions.',
                },
            ],
        };
    }
    async supplyData(itemIndex) {
        const embeddings = (await this.getInputConnectionData(n8n_workflow_1.NodeConnectionTypes.AiEmbedding, itemIndex));
        const workflowId = this.getWorkflow().id;
        const memoryKey = this.getNodeParameter('memoryKey', 0);
        const vectorStoreSingleton = ai_utilities_1.MemoryVectorStoreManager.getInstance(embeddings, this.logger);
        const vectorStoreInstance = await vectorStoreSingleton.getVectorStore(`${workflowId}__${memoryKey}`);
        return {
            response: (0, ai_utilities_1.logWrapper)(vectorStoreInstance, this),
        };
    }
}
exports.VectorStoreInMemoryLoad = VectorStoreInMemoryLoad;
//# sourceMappingURL=VectorStoreInMemoryLoad.node.js.map