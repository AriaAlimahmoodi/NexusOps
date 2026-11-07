"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.description = void 0;
exports.execute = execute;
const n8n_workflow_1 = require("n8n-workflow");
const transport_1 = require("../../../transport");
const descriptions_1 = require("../descriptions");
const properties = [descriptions_1.assistantRLC];
const displayOptions = {
    show: {
        operation: ['deleteAssistant'],
        resource: ['assistant'],
    },
};
exports.description = (0, n8n_workflow_1.updateDisplayOptions)(displayOptions, properties);
async function execute(i) {
    const assistantId = this.getNodeParameter('assistantId', i, '', { extractValue: true });
    const response = await transport_1.apiRequest.call(this, 'DELETE', `/assistants/${assistantId}`, {
        headers: {
            'OpenAI-Beta': 'assistants=v2',
        },
    });
    return [
        {
            json: response,
            pairedItem: { item: i },
        },
    ];
}
//# sourceMappingURL=deleteAssistant.operation.js.map