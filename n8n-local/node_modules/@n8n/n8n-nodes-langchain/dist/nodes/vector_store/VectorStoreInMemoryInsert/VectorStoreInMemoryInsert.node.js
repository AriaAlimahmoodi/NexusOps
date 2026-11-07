"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VectorStoreInMemoryInsert = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const ai_utilities_1 = require("@n8n/ai-utilities");
class VectorStoreInMemoryInsert {
    constructor() {
        this.description = {
            displayName: 'In Memory Vector Store Insert',
            name: 'vectorStoreInMemoryInsert',
            icon: 'fa:database',
            group: ['transform'],
            version: 1,
            hidden: true,
            description: 'Insert data into an in-memory vector store',
            defaults: {
                name: 'In Memory Vector Store Insert',
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
                n8n_workflow_1.NodeConnectionTypes.Main,
                {
                    displayName: 'Document',
                    maxConnections: 1,
                    type: n8n_workflow_1.NodeConnectionTypes.AiDocument,
                    required: true,
                },
                {
                    displayName: 'Embedding',
                    maxConnections: 1,
                    type: n8n_workflow_1.NodeConnectionTypes.AiEmbedding,
                    required: true,
                },
            ],
            outputs: [n8n_workflow_1.NodeConnectionTypes.Main],
            properties: [
                {
                    displayName: 'The embbded data are stored in the server memory, so they will be lost when the server is restarted. Additionally, if the amount of data is too large, it may cause the server to crash due to insufficient memory.',
                    name: 'notice',
                    type: 'notice',
                    default: '',
                },
                {
                    displayName: 'Clear Store',
                    name: 'clearStore',
                    type: 'boolean',
                    default: false,
                    description: 'Whether to clear the store before inserting new data',
                },
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
    async execute() {
        const items = this.getInputData(0);
        const embeddings = (await this.getInputConnectionData(n8n_workflow_1.NodeConnectionTypes.AiEmbedding, 0));
        const memoryKey = this.getNodeParameter('memoryKey', 0);
        const clearStore = this.getNodeParameter('clearStore', 0);
        const documentInput = (await this.getInputConnectionData(n8n_workflow_1.NodeConnectionTypes.AiDocument, 0));
        const { processedDocuments, serializedDocuments } = await (0, ai_utilities_1.processDocuments)(documentInput, items);
        const workflowId = this.getWorkflow().id;
        const vectorStoreInstance = ai_utilities_1.MemoryVectorStoreManager.getInstance(embeddings, this.logger);
        await vectorStoreInstance.addDocuments(`${workflowId}__${memoryKey}`, processedDocuments, clearStore);
        return [serializedDocuments];
    }
}
exports.VectorStoreInMemoryInsert = VectorStoreInMemoryInsert;
//# sourceMappingURL=VectorStoreInMemoryInsert.node.js.map