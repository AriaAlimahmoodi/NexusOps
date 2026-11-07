"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.description = exports.properties = void 0;
exports.execute = execute;
const n8n_workflow_1 = require("n8n-workflow");
const transport_1 = require("../../transport");
exports.properties = [
    {
        displayName: 'File ID',
        name: 'fileId',
        type: 'string',
        placeholder: 'e.g. file_123',
        description: 'ID of the file to delete',
        default: '',
    },
];
const displayOptions = {
    show: {
        operation: ['deleteFile'],
        resource: ['file'],
    },
};
exports.description = (0, n8n_workflow_1.updateDisplayOptions)(displayOptions, exports.properties);
async function execute(i) {
    const fileId = this.getNodeParameter('fileId', i, '');
    const response = (await transport_1.apiRequest.call(this, 'DELETE', `/v1/files/${fileId}`));
    return [
        {
            json: response,
            pairedItem: { item: i },
        },
    ];
}
//# sourceMappingURL=delete.operation.js.map