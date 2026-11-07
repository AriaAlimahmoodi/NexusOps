"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.description = void 0;
exports.execute = execute;
const n8n_workflow_1 = require("n8n-workflow");
const transport_1 = require("../../../transport");
const properties = [
    {
        displayName: 'Options',
        name: 'options',
        placeholder: 'Add Option',
        type: 'collection',
        default: {},
        options: [
            {
                displayName: 'Purpose',
                name: 'purpose',
                type: 'options',
                default: 'any',
                description: 'Only return files with the given purpose',
                options: [
                    {
                        name: 'Any [Default]',
                        value: 'any',
                    },
                    {
                        name: 'Assistants',
                        value: 'assistants',
                    },
                    {
                        name: 'Fine-Tune',
                        value: 'fine-tune',
                    },
                    {
                        name: 'Vision',
                        value: 'vision',
                    },
                    {
                        name: 'User Data',
                        value: 'user_data',
                    },
                ],
            },
        ],
    },
];
const displayOptions = {
    show: {
        operation: ['list'],
        resource: ['file'],
    },
};
exports.description = (0, n8n_workflow_1.updateDisplayOptions)(displayOptions, properties);
async function execute(i) {
    const options = this.getNodeParameter('options', i, {});
    const qs = {};
    if (options.purpose && options.purpose !== 'any') {
        qs.purpose = options.purpose;
    }
    const { data } = await transport_1.apiRequest.call(this, 'GET', '/files', { qs });
    return (data || []).map((file) => ({
        json: file,
        pairedItem: { item: i },
    }));
}
//# sourceMappingURL=list.operation.js.map