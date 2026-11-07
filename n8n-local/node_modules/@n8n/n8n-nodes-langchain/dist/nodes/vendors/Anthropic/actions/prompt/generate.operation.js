"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.description = void 0;
exports.execute = execute;
const n8n_workflow_1 = require("n8n-workflow");
const transport_1 = require("../../transport");
const properties = [
    {
        displayName: 'Task',
        name: 'task',
        type: 'string',
        description: "Description of the prompt's purpose",
        placeholder: 'e.g. A chef for a meal prep planning service',
        default: '',
        typeOptions: {
            rows: 2,
        },
    },
    {
        displayName: 'Simplify Output',
        name: 'simplify',
        type: 'boolean',
        default: true,
        description: 'Whether to return a simplified version of the response instead of the raw data',
    },
];
const displayOptions = {
    show: {
        operation: ['generate'],
        resource: ['prompt'],
    },
};
exports.description = (0, n8n_workflow_1.updateDisplayOptions)(displayOptions, properties);
async function execute(i) {
    const task = this.getNodeParameter('task', i, '');
    const simplify = this.getNodeParameter('simplify', i, true);
    const body = {
        task,
    };
    const response = (await transport_1.apiRequest.call(this, 'POST', '/v1/experimental/generate_prompt', {
        body,
        enableAnthropicBetas: { promptTools: true },
    }));
    if (simplify) {
        return [
            {
                json: {
                    messages: response.messages,
                    system: response.system,
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
//# sourceMappingURL=generate.operation.js.map