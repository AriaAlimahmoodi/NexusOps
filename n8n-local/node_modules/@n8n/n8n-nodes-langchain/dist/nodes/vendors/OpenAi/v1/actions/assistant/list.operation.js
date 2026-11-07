"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.description = void 0;
exports.execute = execute;
const n8n_workflow_1 = require("n8n-workflow");
const transport_1 = require("../../../transport");
const properties = [
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
        operation: ['list'],
        resource: ['assistant'],
    },
};
exports.description = (0, n8n_workflow_1.updateDisplayOptions)(displayOptions, properties);
async function execute(i) {
    const returnData = [];
    let has_more = true;
    let after;
    do {
        const response = await transport_1.apiRequest.call(this, 'GET', '/assistants', {
            headers: {
                'OpenAI-Beta': 'assistants=v2',
            },
            qs: {
                limit: 100,
                after,
            },
        });
        for (const assistant of response.data || []) {
            try {
                assistant.created_at = new Date(assistant.created_at * 1000).toISOString();
            }
            catch (error) { }
            returnData.push({ json: assistant, pairedItem: { item: i } });
        }
        has_more = response.has_more;
        if (has_more) {
            after = response.last_id;
        }
        else {
            break;
        }
    } while (has_more);
    const simplify = this.getNodeParameter('simplify', i);
    if (simplify) {
        return returnData.map((item) => {
            const { id, name, model } = item.json;
            return {
                json: {
                    id,
                    name,
                    model,
                },
                pairedItem: { item: i },
            };
        });
    }
    return returnData;
}
//# sourceMappingURL=list.operation.js.map