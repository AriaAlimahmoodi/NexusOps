"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.description = void 0;
exports.execute = execute;
const n8n_workflow_1 = require("n8n-workflow");
const transport_1 = require("../../transport");
const properties = [
    {
        displayName: 'Messages',
        name: 'messages',
        type: 'fixedCollection',
        typeOptions: {
            sortable: true,
            multipleValues: true,
        },
        description: 'Messages that constitute the prompt to be templatized',
        placeholder: 'Add Message',
        default: { values: [{ content: '', role: 'user' }] },
        options: [
            {
                displayName: 'Values',
                name: 'values',
                values: [
                    {
                        displayName: 'Prompt',
                        name: 'content',
                        type: 'string',
                        description: 'The content of the message to be sent',
                        default: '',
                        placeholder: 'e.g. Translate hello to German',
                        typeOptions: {
                            rows: 2,
                        },
                    },
                    {
                        displayName: 'Role',
                        name: 'role',
                        type: 'options',
                        description: "Role in shaping the model's response, it tells the model how it should behave and interact with the user",
                        options: [
                            {
                                name: 'User',
                                value: 'user',
                                description: 'Send a message as a user and get a response from the model',
                            },
                            {
                                name: 'Assistant',
                                value: 'assistant',
                                description: 'Tell the model to adopt a specific tone or personality',
                            },
                        ],
                        default: 'user',
                    },
                ],
            },
        ],
    },
    {
        displayName: 'Simplify Output',
        name: 'simplify',
        type: 'boolean',
        default: true,
        description: 'Whether to return a simplified version of the response instead of the raw data',
    },
    {
        displayName: 'Options',
        name: 'options',
        placeholder: 'Add Option',
        type: 'collection',
        default: {},
        options: [
            {
                displayName: 'System Message',
                name: 'system',
                type: 'string',
                description: 'The existing system prompt to templatize',
                default: '',
                placeholder: 'e.g. You are a professional English to German translator',
            },
        ],
    },
];
const displayOptions = {
    show: {
        operation: ['templatize'],
        resource: ['prompt'],
    },
};
exports.description = (0, n8n_workflow_1.updateDisplayOptions)(displayOptions, properties);
async function execute(i) {
    const messages = this.getNodeParameter('messages.values', i, []);
    const simplify = this.getNodeParameter('simplify', i, true);
    const options = this.getNodeParameter('options', i, {});
    const body = {
        messages,
        system: options.system,
    };
    const response = (await transport_1.apiRequest.call(this, 'POST', '/v1/experimental/templatize_prompt', {
        body,
        enableAnthropicBetas: { promptTools: true },
    }));
    if (simplify) {
        return [
            {
                json: {
                    messages: response.messages,
                    system: response.system,
                    variable_values: response.variable_values,
                },
                pairedItem: { item: i },
            },
        ];
    }
    return [
        {
            json: { ...response },
            pairedItem: { item: i },
        },
    ];
}
//# sourceMappingURL=templatize.operation.js.map