"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.description = void 0;
exports.execute = execute;
const n8n_workflow_1 = require("n8n-workflow");
const baseAnalyze_1 = require("../../helpers/baseAnalyze");
const descriptions_1 = require("../descriptions");
const properties = [
    (0, descriptions_1.modelRLC)('audioModelSearch'),
    {
        displayName: 'Text Input',
        name: 'text',
        type: 'string',
        placeholder: "e.g. What's in this audio?",
        default: "What's in this audio?",
        typeOptions: {
            rows: 2,
        },
    },
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
        description: 'URL(s) of the audio(s) to analyze, multiple URLs can be added separated by comma',
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
        placeholder: 'Add Option',
        type: 'collection',
        default: {},
        options: [
            {
                displayName: 'Length of Description (Max Tokens)',
                description: 'Fewer tokens will result in shorter, less detailed audio description',
                name: 'maxOutputTokens',
                type: 'number',
                default: 300,
                typeOptions: {
                    minValue: 1,
                },
            },
        ],
    },
];
const displayOptions = {
    show: {
        operation: ['analyze'],
        resource: ['audio'],
    },
};
exports.description = (0, n8n_workflow_1.updateDisplayOptions)(displayOptions, properties);
async function execute(i) {
    return await baseAnalyze_1.baseAnalyze.call(this, i, 'audioUrls', 'audio/mpeg');
}
//# sourceMappingURL=analyze.operation.js.map