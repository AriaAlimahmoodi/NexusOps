"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.description = void 0;
exports.execute = execute;
const n8n_workflow_1 = require("n8n-workflow");
const transport_1 = require("../../../transport");
const properties = [
    {
        displayName: 'File',
        name: 'fileId',
        type: 'resourceLocator',
        default: { mode: 'list', value: '' },
        required: true,
        modes: [
            {
                displayName: 'From List',
                name: 'list',
                type: 'list',
                typeOptions: {
                    searchListMethod: 'fileSearch',
                    searchable: true,
                },
            },
            {
                displayName: 'ID',
                name: 'id',
                type: 'string',
                validation: [
                    {
                        type: 'regex',
                        properties: {
                            regex: 'file-[a-zA-Z0-9]',
                            errorMessage: 'Not a valid File ID',
                        },
                    },
                ],
                placeholder: 'e.g. file-1234567890',
            },
        ],
    },
];
const displayOptions = {
    show: {
        operation: ['deleteFile'],
        resource: ['file'],
    },
};
exports.description = (0, n8n_workflow_1.updateDisplayOptions)(displayOptions, properties);
async function execute(i) {
    const fileId = this.getNodeParameter('fileId', i, '', { extractValue: true });
    const response = await transport_1.apiRequest.call(this, 'DELETE', `/files/${fileId}`);
    return [
        {
            json: response,
            pairedItem: { item: i },
        },
    ];
}
//# sourceMappingURL=deleteFile.operation.js.map