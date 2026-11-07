"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentJsonInputLoader = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const ai_utilities_1 = require("@n8n/ai-utilities");
class DocumentJsonInputLoader {
    constructor() {
        this.description = {
            hidden: true,
            displayName: 'JSON Input Loader',
            name: 'documentJsonInputLoader',
            icon: 'file:json.svg',
            group: ['transform'],
            version: 1,
            description: 'Use JSON data from a previous step in the workflow',
            defaults: {
                name: 'JSON Input Loader',
            },
            codex: {
                categories: ['AI'],
                subcategories: {
                    AI: ['Document Loaders'],
                },
                resources: {
                    primaryDocumentation: [
                        {
                            url: 'https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.documentdefaultdataloader/',
                        },
                    ],
                },
            },
            inputs: [
                {
                    displayName: 'Text Splitter',
                    maxConnections: 1,
                    type: n8n_workflow_1.NodeConnectionTypes.AiTextSplitter,
                },
            ],
            inputNames: ['Text Splitter'],
            outputs: [n8n_workflow_1.NodeConnectionTypes.AiDocument],
            outputNames: ['Document'],
            builderHint: {
                inputs: {
                    ai_textSplitter: { required: false },
                },
            },
            properties: [
                (0, ai_utilities_1.getConnectionHintNoticeField)([n8n_workflow_1.NodeConnectionTypes.AiVectorStore]),
                {
                    displayName: 'Pointers',
                    name: 'pointers',
                    type: 'string',
                    default: '',
                    description: 'Pointers to extract from JSON, e.g. "/text" or "/text, /meta/title"',
                },
                {
                    displayName: 'Options',
                    name: 'options',
                    type: 'collection',
                    placeholder: 'Add Option',
                    default: {},
                    options: [
                        {
                            ...ai_utilities_1.metadataFilterField,
                            displayName: 'Metadata',
                            description: 'Metadata to add to each document. Could be used for filtering during retrieval',
                            placeholder: 'Add property',
                        },
                    ],
                },
            ],
        };
    }
    async supplyData() {
        this.logger.debug('Supply Data for JSON Input Loader');
        const textSplitter = (await this.getInputConnectionData(n8n_workflow_1.NodeConnectionTypes.AiTextSplitter, 0));
        const processor = new ai_utilities_1.N8nJsonLoader(this, undefined, textSplitter);
        return {
            response: (0, ai_utilities_1.logWrapper)(processor, this),
        };
    }
}
exports.DocumentJsonInputLoader = DocumentJsonInputLoader;
//# sourceMappingURL=DocumentJsonInputLoader.node.js.map