"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.description = exports.properties = void 0;
exports.execute = execute;
const n8n_workflow_1 = require("n8n-workflow");
const utils_1 = require("../../helpers/utils");
exports.properties = [
    {
        displayName: 'Page Size',
        name: 'pageSize',
        type: 'number',
        description: 'Maximum number of File Search stores to return per page (max 20)',
        default: 10,
        typeOptions: {
            minValue: 1,
            maxValue: 20,
        },
    },
    {
        displayName: 'Page Token',
        name: 'pageToken',
        type: 'string',
        description: 'Token from a previous page to retrieve the next page of results',
        default: '',
    },
];
const displayOptions = {
    show: {
        operation: ['listStores'],
        resource: ['fileSearch'],
    },
};
exports.description = (0, n8n_workflow_1.updateDisplayOptions)(displayOptions, exports.properties);
async function execute(i) {
    const pageSize = this.getNodeParameter('pageSize', i);
    const pageToken = this.getNodeParameter('pageToken', i, '');
    const response = await utils_1.listFileSearchStores.call(this, pageSize, pageToken);
    return [
        {
            json: response,
            pairedItem: {
                item: i,
            },
        },
    ];
}
//# sourceMappingURL=listStores.operation.js.map