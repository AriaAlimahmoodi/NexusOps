"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.description = exports.properties = void 0;
exports.execute = execute;
const n8n_workflow_1 = require("n8n-workflow");
const utils_1 = require("../../helpers/utils");
exports.properties = [
    {
        displayName: 'File Search Store Name',
        name: 'fileSearchStoreName',
        type: 'string',
        placeholder: 'e.g. fileSearchStores/abc123',
        description: 'The full name of the File Search store to upload to (format: fileSearchStores/...)',
        default: '',
        required: true,
    },
    {
        displayName: 'File Display Name',
        name: 'displayName',
        type: 'string',
        placeholder: 'e.g. My Document',
        description: 'A human-readable name for the file (will be visible in citations)',
        default: '',
        required: true,
    },
    {
        displayName: 'Input Type',
        name: 'inputType',
        type: 'options',
        default: 'url',
        options: [
            {
                name: 'File URL',
                value: 'url',
            },
            {
                name: 'Binary File',
                value: 'binary',
            },
        ],
    },
    {
        displayName: 'URL',
        name: 'fileUrl',
        type: 'string',
        placeholder: 'e.g. https://example.com/file.pdf',
        description: 'URL of the file to upload',
        default: '',
        displayOptions: {
            show: {
                inputType: ['url'],
            },
        },
    },
    {
        displayName: 'Input Data Field Name',
        name: 'binaryPropertyName',
        type: 'string',
        default: 'data',
        placeholder: 'e.g. data',
        hint: 'The name of the input field containing the binary file data to be processed',
        description: 'Name of the binary property which contains the file',
        displayOptions: {
            show: {
                inputType: ['binary'],
            },
        },
    },
];
const displayOptions = {
    show: {
        operation: ['uploadToStore'],
        resource: ['fileSearch'],
    },
};
exports.description = (0, n8n_workflow_1.updateDisplayOptions)(displayOptions, exports.properties);
async function execute(i) {
    const fileSearchStoreName = this.getNodeParameter('fileSearchStoreName', i, '');
    const displayName = this.getNodeParameter('displayName', i, '');
    const inputType = this.getNodeParameter('inputType', i, 'url');
    let fileUrl;
    if (inputType === 'url') {
        fileUrl = this.getNodeParameter('fileUrl', i, '');
    }
    const response = await utils_1.uploadToFileSearchStore.call(this, i, fileSearchStoreName, displayName, fileUrl, 'application/octet-stream');
    return [
        {
            json: response ?? {},
            pairedItem: {
                item: i,
            },
        },
    ];
}
//# sourceMappingURL=uploadToStore.operation.js.map