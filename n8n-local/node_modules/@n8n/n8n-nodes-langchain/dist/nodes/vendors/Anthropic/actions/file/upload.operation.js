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
        description: 'Name of the binary field which contains the file',
        displayOptions: {
            show: {
                inputType: ['binary'],
            },
        },
    },
    {
        displayName: 'Options',
        name: 'options',
        type: 'collection',
        placeholder: 'Add Option',
        default: {},
        options: [
            {
                displayName: 'File Name',
                name: 'fileName',
                type: 'string',
                description: 'The file name to use for the uploaded file',
                default: '',
            },
        ],
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
    const fileName = this.getNodeParameter('options.fileName', i, 'file');
    const baseUrl = await utils_1.getBaseUrl.call(this);
    let response;
    if (inputType === 'url') {
        const fileUrl = this.getNodeParameter('fileUrl', i, '');
        const { fileContent, mimeType } = await utils_1.downloadFile.call(this, fileUrl);
        response = await utils_1.uploadFile.call(this, fileContent, mimeType, fileName);
    }
    else {
        const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i, 'data');
        const binaryData = this.helpers.assertBinaryData(i, binaryPropertyName);
        const buffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);
        response = await utils_1.uploadFile.call(this, buffer, binaryData.mimeType, fileName);
    }
    return [
        {
            json: { ...response, url: `${baseUrl}/v1/files/${response.id}` },
            pairedItem: {
                item: i,
            },
        },
    ];
}
//# sourceMappingURL=upload.operation.js.map