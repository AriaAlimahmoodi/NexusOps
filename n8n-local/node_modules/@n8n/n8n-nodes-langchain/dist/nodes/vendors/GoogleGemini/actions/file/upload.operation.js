"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.description = exports.properties = void 0;
exports.execute = execute;
const n8n_workflow_1 = require("n8n-workflow");
const utils_1 = require("../../helpers/utils");
exports.properties = [
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
        operation: ['upload'],
        resource: ['file'],
    },
};
exports.description = (0, n8n_workflow_1.updateDisplayOptions)(displayOptions, exports.properties);
async function execute(i) {
    const inputType = this.getNodeParameter('inputType', i, 'url');
    let fileUrl;
    if (inputType === 'url') {
        fileUrl = this.getNodeParameter('fileUrl', i, '');
    }
    const response = await utils_1.transferFile.call(this, i, fileUrl, 'application/octet-stream');
    return [
        {
            json: response,
            pairedItem: {
                item: i,
            },
        },
    ];
}
//# sourceMappingURL=upload.operation.js.map