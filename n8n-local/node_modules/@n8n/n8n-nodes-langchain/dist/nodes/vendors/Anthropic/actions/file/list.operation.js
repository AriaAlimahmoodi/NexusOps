"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.description = exports.properties = void 0;
exports.execute = execute;
const n8n_workflow_1 = require("n8n-workflow");
const utils_1 = require("../../helpers/utils");
const transport_1 = require("../../transport");
exports.properties = [
    {
        displayName: 'Return All',
        name: 'returnAll',
        type: 'boolean',
        default: false,
        description: 'Whether to return all results or only up to a given limit',
    },
    {
        displayName: 'Limit',
        name: 'limit',
        type: 'number',
        typeOptions: {
            minValue: 1,
            maxValue: 1000,
        },
        default: 50,
        description: 'Max number of results to return',
        displayOptions: {
            show: {
                returnAll: [false],
            },
        },
    },
];
const displayOptions = {
    show: {
        operation: ['list'],
        resource: ['file'],
    },
};
exports.description = (0, n8n_workflow_1.updateDisplayOptions)(displayOptions, exports.properties);
async function execute(i) {
    const returnAll = this.getNodeParameter('returnAll', i, false);
    const limit = this.getNodeParameter('limit', i, 50);
    const baseUrl = await utils_1.getBaseUrl.call(this);
    if (returnAll) {
        return await getAllFiles.call(this, baseUrl, i);
    }
    else {
        return await getFiles.call(this, baseUrl, i, limit);
    }
}
async function getAllFiles(baseUrl, i) {
    let hasMore = true;
    let lastId = undefined;
    const files = [];
    while (hasMore) {
        const response = (await transport_1.apiRequest.call(this, 'GET', '/v1/files', {
            qs: {
                limit: 1000,
                after_id: lastId,
            },
        }));
        hasMore = response.has_more;
        lastId = response.last_id;
        files.push(...response.data);
    }
    return files.map((file) => ({
        json: { ...file, url: `${baseUrl}/v1/files/${file.id}` },
        pairedItem: { item: i },
    }));
}
async function getFiles(baseUrl, i, limit) {
    const response = (await transport_1.apiRequest.call(this, 'GET', '/v1/files', {
        qs: {
            limit,
        },
    }));
    return response.data.map((file) => ({
        json: { ...file, url: `${baseUrl}/v1/files/${file.id}` },
        pairedItem: { item: i },
    }));
}
//# sourceMappingURL=list.operation.js.map