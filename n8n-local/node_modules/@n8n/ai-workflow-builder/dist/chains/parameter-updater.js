"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createParameterUpdaterChain = exports.parametersSchema = void 0;
const messages_1 = require("@langchain/core/messages");
const prompts_1 = require("@langchain/core/prompts");
const zod_1 = require("zod");
const builder_1 = require("../prompts/builder");
const parameter_updater_1 = require("../prompts/chains/parameter-updater");
const errors_1 = require("../errors");
exports.parametersSchema = zod_1.z
    .object({
    parameters: zod_1.z
        .object({})
        .passthrough()
        .describe("The complete updated parameters object for the node. This should be a JSON object that matches the node's parameter structure. Include ALL existing parameters plus the requested changes."),
})
    .describe('The complete updated parameters object for the node. Must include only parameters from <node_properties_definition>, for example For example: { "parameters": { "method": "POST", "url": "https://api.example.com", "sendHeaders": true, "headerParameters": { "parameters": [{ "name": "Content-Type", "value": "application/json" }] } } }}');
const nodeDefinitionPrompt = `
The node accepts these properties:
<node_properties_definition>
{node_definition}
</node_properties_definition>`;
const workflowContextPrompt = `
<current_workflow_json>
{workflow_json}
</current_workflow_json>

<current_simplified_execution_data>
{execution_data}
</current_simplified_execution_data>

<current_execution_nodes_schemas>
{execution_schema}
</current_execution_nodes_schemas>

<selected_node>
Name: {node_name}
Type: {node_type}

Current Parameters: {current_parameters}
</selected_node>

<requested_changes>
{changes}
</requested_changes>

Based on the requested changes and the node's property definitions, return the complete updated parameters object.`;
const createParameterUpdaterChain = (llm, options, logger) => {
    if (typeof llm.withStructuredOutput !== 'function') {
        throw new errors_1.LLMServiceError("LLM doesn't support withStructuredOutput", {
            llmModel: llm._llmType(),
        });
    }
    const context = {
        nodeType: options.nodeType,
        nodeDefinition: options.nodeDefinition,
        requestedChanges: options.requestedChanges,
        hasResourceLocatorParams: (0, parameter_updater_1.hasResourceLocatorParameters)(options.nodeDefinition),
    };
    const guides = (0, parameter_updater_1.getMatchingGuides)(context);
    const examples = (0, parameter_updater_1.getMatchingExamples)(context);
    const builder = (0, builder_1.prompt)()
        .section('core_instructions', parameter_updater_1.CORE_INSTRUCTIONS)
        .section('expression_rules', parameter_updater_1.EXPRESSION_RULES);
    for (const guide of guides) {
        const sectionId = `guide_${guide.patterns[0].replace(/[^a-zA-Z0-9]/g, '_')}`;
        builder.section(sectionId, guide.content);
    }
    builder
        .section('common_patterns', parameter_updater_1.COMMON_PATTERNS)
        .examplesIf(examples.length > 0, 'examples', examples)
        .section('output_format', parameter_updater_1.OUTPUT_FORMAT);
    const systemPromptContent = builder.build();
    const tokenEstimate = builder.estimateTokens();
    logger?.debug(`Parameter updater prompt size: ~${tokenEstimate} tokens`);
    const systemPrompt = new messages_1.SystemMessage({
        content: [
            {
                type: 'text',
                text: systemPromptContent,
                cache_control: { type: 'ephemeral' },
            },
        ],
    });
    const nodeDefinitionMessage = prompts_1.ChatPromptTemplate.fromMessages([
        [
            'human',
            [
                {
                    type: 'text',
                    text: nodeDefinitionPrompt,
                    cache_control: { type: 'ephemeral' },
                },
                {
                    type: 'text',
                    text: parameter_updater_1.instanceUrlPrompt,
                },
            ],
        ],
    ]);
    const workflowContextMessage = prompts_1.HumanMessagePromptTemplate.fromTemplate(workflowContextPrompt);
    const prompt = prompts_1.ChatPromptTemplate.fromMessages([
        systemPrompt,
        nodeDefinitionMessage,
        workflowContextMessage,
    ]);
    const llmWithStructuredOutput = llm.withStructuredOutput(exports.parametersSchema);
    const modelWithStructure = prompt.pipe(llmWithStructuredOutput);
    return modelWithStructure;
};
exports.createParameterUpdaterChain = createParameterUpdaterChain;
//# sourceMappingURL=parameter-updater.js.map