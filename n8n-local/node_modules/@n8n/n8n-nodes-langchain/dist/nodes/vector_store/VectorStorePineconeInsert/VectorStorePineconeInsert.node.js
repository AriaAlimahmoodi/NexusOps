"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VectorStorePineconeInsert = void 0;
const pinecone_1 = require("@langchain/pinecone");
const pinecone_2 = require("@pinecone-database/pinecone");
const n8n_workflow_1 = require("n8n-workflow");
const ai_utilities_1 = require("@n8n/ai-utilities");
const listSearch_1 = require("../shared/methods/listSearch");
const descriptions_1 = require("../shared/descriptions");
class VectorStorePineconeInsert {
    constructor() {
        this.description = {
            displayName: 'Pinecone: Insert',
            hidden: true,
            name: 'vectorStorePineconeInsert',
            icon: 'file:pinecone.svg',
            group: ['transform'],
            version: 1,
            description: 'Insert data into Pinecone Vector Store index',
            defaults: {
                name: 'Pinecone: Insert',
                color: '#1321A7',
            },
            codex: {
                categories: ['AI'],
                subcategories: {
                    AI: ['Vector Stores'],
                },
                resources: {
                    primaryDocumentation: [
                        {
                            url: 'https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.vectorstorepinecone/',
                        },
                    ],
                },
            },
            credentials: [
                {
                    name: 'pineconeApi',
                    required: true,
                },
            ],
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
                descriptions_1.pineconeIndexRLC,
                {
                    displayName: 'Pinecone Namespace',
                    name: 'pineconeNamespace',
                    type: 'string',
                    default: '',
                },
                {
                    displayName: 'Specify the document to load in the document loader sub-node',
                    name: 'notice',
                    type: 'notice',
                    default: '',
                },
                {
                    displayName: 'Clear Namespace',
                    name: 'clearNamespace',
                    type: 'boolean',
                    default: false,
                    description: 'Whether to clear the namespace before inserting new data',
                },
            ],
        };
        this.methods = {
            listSearch: {
                pineconeIndexSearch: listSearch_1.pineconeIndexSearch,
            },
        };
    }
    async execute() {
        const items = this.getInputData(0);
        this.logger.debug('Executing data for Pinecone Insert Vector Store');
        const namespace = this.getNodeParameter('pineconeNamespace', 0);
        const index = this.getNodeParameter('pineconeIndex', 0, '', { extractValue: true });
        const clearNamespace = this.getNodeParameter('clearNamespace', 0);
        const credentials = await this.getCredentials('pineconeApi');
        const documentInput = (await this.getInputConnectionData(n8n_workflow_1.NodeConnectionTypes.AiDocument, 0));
        const embeddings = (await this.getInputConnectionData(n8n_workflow_1.NodeConnectionTypes.AiEmbedding, 0));
        const client = new pinecone_2.Pinecone({
            apiKey: credentials.apiKey,
        });
        const pineconeIndex = client.Index(index);
        if (namespace && clearNamespace) {
            await pineconeIndex.namespace(namespace).deleteAll();
        }
        const { processedDocuments, serializedDocuments } = await (0, ai_utilities_1.processDocuments)(documentInput, items);
        await pinecone_1.PineconeStore.fromDocuments(processedDocuments, embeddings, {
            namespace: namespace || undefined,
            pineconeIndex,
        });
        return [serializedDocuments];
    }
}
exports.VectorStorePineconeInsert = VectorStorePineconeInsert;
//# sourceMappingURL=VectorStorePineconeInsert.node.js.map