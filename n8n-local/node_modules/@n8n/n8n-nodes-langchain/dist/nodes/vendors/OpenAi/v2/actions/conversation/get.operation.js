"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.description = void 0;
exports.execute = execute;
const n8n_workflow_1 = require("n8n-workflow");
const transport_1 = require("../../../transport");
const properties = [
    {
        displayName: 'Conversation ID',
        name: 'conversationId',
        type: 'string',
        default: '',
        placeholder: 'conv_1234567890',
        description: 'The ID of the conversation to retrieve',
        required: true,
    },
];
const displayOptions = {
    show: {
        operation: ['get'],
        resource: ['conversation'],
    },
};
exports.description = (0, n8n_workflow_1.updateDisplayOptions)(displayOptions, properties);
async function execute(i) {
    const conversationId = this.getNodeParameter('conversationId', i, '');
    const response = await transport_1.apiRequest.call(this, 'GET', `/conversations/${conversationId}`);
    return [
        {
            json: response,
            pairedItem: { item: i },
        },
    ];
}
//# sourceMappingURL=get.operation.js.map