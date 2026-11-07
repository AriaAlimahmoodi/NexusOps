"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.description = void 0;
exports.execute = execute;
const n8n_workflow_1 = require("n8n-workflow");
const utils_1 = require("../../helpers/utils");
const transport_1 = require("../../transport");
const descriptions_1 = require("../descriptions");
const properties = [
    (0, descriptions_1.modelRLC)('audioModelSearch'),
    {
        displayName: 'Input Type',
        name: 'inputType',
        type: 'options',
        default: 'url',
        options: [
            {
                name: 'Audio URL(s)',
                value: 'url',
            },
            {
                name: 'Binary File(s)',
                value: 'binary',
            },
        ],
    },
    {
        displayName: 'URL(s)',
        name: 'audioUrls',
        type: 'string',
        placeholder: 'e.g. https://example.com/audio.mp3',
        description: 'URL(s) of the audio(s) to transcribe, multiple URLs can be added separated by comma',
        default: '',
        displayOptions: {
            show: {
                inputType: ['url'],
            },
        },
    },
    {
        displayName: 'Input Data Field Name(s)',
        name: 'binaryPropertyName',
        type: 'string',
        default: 'data',
        placeholder: 'e.g. data',
        hint: 'The name of the input field containing the binary file data to be processed',
        description: 'Name of the binary field(s) which contains the audio(s), seperate multiple field names with commas',
        displayOptions: {
            show: {
                inputType: ['binary'],
            },
        },
    },
    {
        displayName: 'Simplify Output',
        name: 'simplify',
        type: 'boolean',
        default: true,
        description: 'Whether to simplify the response or not',
    },
    {
        displayName: 'Options',
        name: 'options',
        type: 'collection',
        default: {},
        options: [
            {
                displayName: 'Start Time',
                name: 'startTime',
                type: 'string',
                default: '',
                description: 'The start time of the audio in MM:SS or HH:MM:SS format',
                placeholder: 'e.g. 00:15',
            },
            {
                displayName: 'End Time',
                name: 'endTime',
                type: 'string',
                default: '',
                description: 'The end time of the audio in MM:SS or HH:MM:SS format',
                placeholder: 'e.g. 02:15',
            },
        ],
    },
];
const displayOptions = {
    show: {
        operation: ['transcribe'],
        resource: ['audio'],
    },
};
exports.description = (0, n8n_workflow_1.updateDisplayOptions)(displayOptions, properties);
async function execute(i) {
    const model = this.getNodeParameter('modelId', i, '', { extractValue: true });
    const inputType = this.getNodeParameter('inputType', i, 'url');
    const simplify = this.getNodeParameter('simplify', i, true);
    const options = this.getNodeParameter('options', i, {});
    let contents;
    if (inputType === 'url') {
        const urls = this.getNodeParameter('audioUrls', i, '');
        const filesDataPromises = urls
            .split(',')
            .map((url) => url.trim())
            .filter((url) => url)
            .map(async (url) => {
            if (url.startsWith('https://generativelanguage.googleapis.com')) {
                const { mimeType } = (await transport_1.apiRequest.call(this, 'GET', '', {
                    option: { url },
                }));
                return { fileUri: url, mimeType };
            }
            else {
                const { fileContent, mimeType } = await utils_1.downloadFile.call(this, url, 'audio/mpeg');
                return await utils_1.uploadFile.call(this, fileContent, mimeType);
            }
        });
        const filesData = await Promise.all(filesDataPromises);
        contents = [
            {
                role: 'user',
                parts: filesData.map((fileData) => ({
                    fileData,
                })),
            },
        ];
    }
    else {
        const binaryPropertyNames = this.getNodeParameter('binaryPropertyName', i, 'data');
        const promises = binaryPropertyNames
            .split(',')
            .map((binaryPropertyName) => binaryPropertyName.trim())
            .filter((binaryPropertyName) => binaryPropertyName)
            .map(async (binaryPropertyName) => {
            const binaryData = this.helpers.assertBinaryData(i, binaryPropertyName);
            const buffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);
            return await utils_1.uploadFile.call(this, buffer, binaryData.mimeType);
        });
        const filesData = await Promise.all(promises);
        contents = [
            {
                role: 'user',
                parts: filesData.map((fileData) => ({
                    fileData,
                })),
            },
        ];
    }
    const text = `Generate a transcript of the speech${options.startTime ? ` from ${options.startTime}` : ''}${options.endTime ? ` to ${options.endTime}` : ''}`;
    contents[0].parts.push({ text });
    const body = {
        contents,
    };
    const response = (await transport_1.apiRequest.call(this, 'POST', `/v1beta/${model}:generateContent`, {
        body,
    }));
    if (simplify) {
        return response.candidates.map((candidate) => ({
            json: candidate,
            pairedItem: { item: i },
        }));
    }
    return [
        {
            json: { ...response },
            pairedItem: { item: i },
        },
    ];
}
//# sourceMappingURL=transcribe.operation.js.map