"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentToolV2 = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const descriptions_1 = require("../../../../utils/descriptions");
const utils_1 = require("./utils");
const description_1 = require("../agents/ToolsAgent/V2/description");
const execute_1 = require("../agents/ToolsAgent/V2/execute");
class AgentToolV2 {
    constructor(baseDescription) {
        this.description = {
            ...baseDescription,
            version: [2.2],
            defaults: {
                name: 'AI Agent Tool',
                color: '#404040',
            },
            inputs: `={{
				((hasOutputParser, needsFallback) => {
					${utils_1.getInputs.toString()};
					return getInputs(false, hasOutputParser, needsFallback)
				})($parameter.hasOutputParser === undefined || $parameter.hasOutputParser === true, $parameter.needsFallback !== undefined && $parameter.needsFallback === true)
			}}`,
            outputs: [n8n_workflow_1.NodeConnectionTypes.AiTool],
            builderHint: {
                ...baseDescription.builderHint,
                inputs: {
                    ai_languageModel: { required: true },
                    ai_memory: { required: false },
                    ai_tool: { required: false },
                    ai_outputParser: {
                        required: false,
                        displayOptions: { show: { hasOutputParser: [true] } },
                    },
                },
            },
            properties: [
                descriptions_1.toolDescription,
                {
                    ...descriptions_1.textInput,
                },
                {
                    displayName: 'Require Specific Output Format',
                    name: 'hasOutputParser',
                    type: 'boolean',
                    default: false,
                    noDataExpression: true,
                },
                {
                    displayName: `Connect an <a data-action='openSelectiveNodeCreator' data-action-parameter-connectiontype='${n8n_workflow_1.NodeConnectionTypes.AiOutputParser}'>output parser</a> on the canvas to specify the output format you require`,
                    name: 'notice',
                    type: 'notice',
                    default: '',
                    displayOptions: {
                        show: {
                            hasOutputParser: [true],
                        },
                    },
                },
                {
                    displayName: 'Enable Fallback Model',
                    name: 'needsFallback',
                    type: 'boolean',
                    default: false,
                    noDataExpression: true,
                    displayOptions: {
                        show: {
                            '@version': [{ _cnd: { gte: 2.1 } }],
                        },
                    },
                },
                {
                    displayName: 'Connect an additional language model on the canvas to use it as a fallback if the main model fails',
                    name: 'fallbackNotice',
                    type: 'notice',
                    default: '',
                    displayOptions: {
                        show: {
                            needsFallback: [true],
                        },
                    },
                },
                ...(0, description_1.getToolsAgentProperties)({ withStreaming: false }),
            ],
        };
    }
    async execute() {
        return await execute_1.toolsAgentExecute.call(this);
    }
}
exports.AgentToolV2 = AgentToolV2;
//# sourceMappingURL=AgentToolV2.node.js.map