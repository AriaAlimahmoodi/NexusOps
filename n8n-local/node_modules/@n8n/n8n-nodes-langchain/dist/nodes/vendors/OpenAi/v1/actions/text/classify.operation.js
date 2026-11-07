"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.description = void 0;
exports.execute = execute;
const n8n_workflow_1 = require("n8n-workflow");
const transport_1 = require("../../../transport");
const properties = [
    {
        displayName: 'Text Input',
        name: 'input',
        type: 'string',
        placeholder: 'e.g. Sample text goes here',
        description: 'The input text to classify if it is violates the moderation policy',
        default: '',
        typeOptions: {
            rows: 2,
        },
    },
    {
        displayName: 'Simplify Output',
        name: 'simplify',
        type: 'boolean',
        default: false,
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
                displayName: 'Use Stable Model',
                name: 'useStableModel',
                type: 'boolean',
                default: false,
                description: 'Whether to use the stable version of the model instead of the latest version, accuracy may be slightly lower',
            },
        ],
    },
];
const displayOptions = {
    show: {
        operation: ['classify'],
        resource: ['text'],
    },
};
exports.description = (0, n8n_workflow_1.updateDisplayOptions)(displayOptions, properties);
async function execute(i) {
    const input = this.getNodeParameter('input', i);
    const options = this.getNodeParameter('options', i);
    const model = options.useStableModel ? 'text-moderation-stable' : 'text-moderation-latest';
    const body = {
        input,
        model,
    };
    const { results } = await transport_1.apiRequest.call(this, 'POST', '/moderations', { body });
    if (!results)
        return [];
    const simplify = this.getNodeParameter('simplify', i);
    if (simplify && results) {
        return [
            {
                json: { flagged: results[0].flagged },
                pairedItem: { item: i },
            },
        ];
    }
    else {
        return [
            {
                json: results[0],
                pairedItem: { item: i },
            },
        ];
    }
}
//# sourceMappingURL=classify.operation.js.map