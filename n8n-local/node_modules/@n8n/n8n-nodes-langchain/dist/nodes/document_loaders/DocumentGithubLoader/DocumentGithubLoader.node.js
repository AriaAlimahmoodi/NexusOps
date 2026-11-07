"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentGithubLoader = void 0;
const github_1 = require("@langchain/community/document_loaders/web/github");
const textsplitters_1 = require("@langchain/textsplitters");
const ai_utilities_1 = require("@n8n/ai-utilities");
const n8n_workflow_1 = require("n8n-workflow");
function getInputs(parameters) {
    const inputs = [];
    const textSplittingMode = parameters?.textSplittingMode;
    if (!textSplittingMode || textSplittingMode === 'custom') {
        inputs.push({
            displayName: 'Text Splitter',
            maxConnections: 1,
            type: 'ai_textSplitter',
            required: true,
        });
    }
    return inputs;
}
class DocumentGithubLoader {
    constructor() {
        this.description = {
            displayName: 'GitHub Document Loader',
            name: 'documentGithubLoader',
            icon: 'file:github.svg',
            group: ['transform'],
            version: [1, 1.1],
            defaultVersion: 1.1,
            description: 'Use GitHub data as input to this chain',
            hidden: true,
            defaults: {
                name: 'GitHub Document Loader',
            },
            codex: {
                categories: ['AI'],
                subcategories: {
                    AI: ['Document Loaders'],
                },
                resources: {
                    primaryDocumentation: [
                        {
                            url: 'https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.documentgithubloader/',
                        },
                    ],
                },
            },
            credentials: [
                {
                    name: 'githubApi',
                    required: true,
                },
            ],
            inputs: `={{ ((parameter) => { ${getInputs.toString()}; return getInputs(parameter) })($parameter) }}`,
            inputNames: ['Text Splitter'],
            outputs: [n8n_workflow_1.NodeConnectionTypes.AiDocument],
            outputNames: ['Document'],
            builderHint: {
                inputs: {
                    ai_textSplitter: {
                        required: true,
                        displayOptions: { show: { textSplittingMode: ['custom'] } },
                    },
                },
            },
            properties: [
                (0, ai_utilities_1.getConnectionHintNoticeField)([n8n_workflow_1.NodeConnectionTypes.AiVectorStore]),
                {
                    displayName: 'Repository Link',
                    name: 'repository',
                    type: 'string',
                    default: '',
                },
                {
                    displayName: 'Branch',
                    name: 'branch',
                    type: 'string',
                    default: 'main',
                },
                {
                    displayName: 'Text Splitting',
                    name: 'textSplittingMode',
                    type: 'options',
                    default: 'simple',
                    required: true,
                    noDataExpression: true,
                    displayOptions: {
                        show: {
                            '@version': [1.1],
                        },
                    },
                    options: [
                        {
                            name: 'Simple',
                            value: 'simple',
                            description: 'Splits every 1000 characters with a 200 character overlap',
                        },
                        {
                            name: 'Custom',
                            value: 'custom',
                            description: 'Connect a custom text-splitting sub-node',
                        },
                    ],
                },
                {
                    displayName: 'Options',
                    name: 'additionalOptions',
                    type: 'collection',
                    placeholder: 'Add Option',
                    default: {},
                    options: [
                        {
                            displayName: 'Recursive',
                            name: 'recursive',
                            type: 'boolean',
                            default: false,
                        },
                        {
                            displayName: 'Ignore Paths',
                            name: 'ignorePaths',
                            type: 'string',
                            description: 'Comma-separated list of paths to ignore, e.g. "docs, src/tests',
                            default: '',
                        },
                    ],
                },
            ],
        };
    }
    async supplyData(itemIndex) {
        this.logger.debug('Supplying data for Github Document Loader');
        const node = this.getNode();
        const repository = this.getNodeParameter('repository', itemIndex);
        const branch = this.getNodeParameter('branch', itemIndex);
        const credentials = await this.getCredentials('githubApi');
        const { ignorePaths, recursive } = this.getNodeParameter('additionalOptions', 0);
        let textSplitter;
        if (node.typeVersion === 1.1) {
            const textSplittingMode = this.getNodeParameter('textSplittingMode', itemIndex, 'simple');
            if (textSplittingMode === 'simple') {
                textSplitter = new textsplitters_1.RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
            }
            else if (textSplittingMode === 'custom') {
                textSplitter = (await this.getInputConnectionData(n8n_workflow_1.NodeConnectionTypes.AiTextSplitter, 0));
            }
        }
        else {
            textSplitter = (await this.getInputConnectionData(n8n_workflow_1.NodeConnectionTypes.AiTextSplitter, 0));
        }
        const { index } = this.addInputData(n8n_workflow_1.NodeConnectionTypes.AiDocument, [
            [{ json: { repository, branch, ignorePaths, recursive } }],
        ]);
        const docs = new github_1.GithubRepoLoader(repository, {
            branch,
            ignorePaths: (ignorePaths ?? '').split(',').map((p) => p.trim()),
            recursive,
            accessToken: credentials.accessToken || '',
            apiUrl: credentials.server,
        });
        const loadedDocs = textSplitter
            ? await textSplitter.splitDocuments(await docs.load())
            : await docs.load();
        this.addOutputData(n8n_workflow_1.NodeConnectionTypes.AiDocument, index, [[{ json: { loadedDocs } }]]);
        return {
            response: (0, ai_utilities_1.logWrapper)(loadedDocs, this),
        };
    }
}
exports.DocumentGithubLoader = DocumentGithubLoader;
//# sourceMappingURL=DocumentGithubLoader.node.js.map