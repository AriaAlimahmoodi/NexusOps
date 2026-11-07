"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolWolframAlpha = void 0;
const wolframalpha_1 = require("@langchain/community/tools/wolframalpha");
const n8n_workflow_1 = require("n8n-workflow");
const ai_utilities_1 = require("@n8n/ai-utilities");
class ToolWolframAlpha {
    constructor() {
        this.description = {
            displayName: 'Wolfram|Alpha',
            name: 'toolWolframAlpha',
            icon: 'file:wolfram-alpha.svg',
            group: ['transform'],
            version: 1,
            description: "Connects to WolframAlpha's computational intelligence engine.",
            defaults: {
                name: 'Wolfram Alpha',
            },
            credentials: [
                {
                    name: 'wolframAlphaApi',
                    required: true,
                },
            ],
            codex: {
                categories: ['AI'],
                subcategories: {
                    AI: ['Tools'],
                    Tools: ['Other Tools'],
                },
                resources: {
                    primaryDocumentation: [
                        {
                            url: 'https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.toolwolframalpha/',
                        },
                    ],
                },
            },
            inputs: [],
            outputs: [n8n_workflow_1.NodeConnectionTypes.AiTool],
            outputNames: ['Tool'],
            properties: [(0, ai_utilities_1.getConnectionHintNoticeField)([n8n_workflow_1.NodeConnectionTypes.AiAgent])],
        };
    }
    async supplyData() {
        const credentials = await this.getCredentials('wolframAlphaApi');
        return {
            response: (0, ai_utilities_1.logWrapper)(new wolframalpha_1.WolframAlphaTool({ appid: credentials.appId }), this),
        };
    }
    async execute() {
        const credentials = await this.getCredentials('wolframAlphaApi');
        const input = this.getInputData();
        const result = [];
        for (let i = 0; i < input.length; i++) {
            const item = input[i];
            const tool = new wolframalpha_1.WolframAlphaTool({ appid: credentials.appId });
            result.push({
                json: {
                    response: await tool.invoke(item.json),
                },
                pairedItem: {
                    item: i,
                },
            });
        }
        return [result];
    }
}
exports.ToolWolframAlpha = ToolWolframAlpha;
//# sourceMappingURL=ToolWolframAlpha.node.js.map