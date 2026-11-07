"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.description = void 0;
exports.execute = execute;
const n8n_workflow_1 = require("n8n-workflow");
const baseAnalyze_1 = require("../../helpers/baseAnalyze");
const descriptions_1 = require("../descriptions");
const properties = [
    descriptions_1.modelRLC,
    {
        displayName: 'Text Input',
        name: 'text',
        type: 'string',
        placeholder: "e.g. What's in this image?",
        default: "What's in this image?",
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
                name: 'Image URL(s)',
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
        name: 'imageUrls',
        type: 'string',
        placeholder: 'e.g. https://example.com/image.png',
        description: 'URL(s) of the image(s) to analyze, multiple URLs can be added separated by comma',
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
        description: 'Name of the binary field(s) which contains the image(s), seperate multiple field names with commas',
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
                description: 'Fewer tokens will result in shorter, less detailed image description',
                name: 'maxTokens',
                type: 'number',
                default: 1024,
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
        resource: ['image'],
    },
};
exports.description = (0, n8n_workflow_1.updateDisplayOptions)(displayOptions, properties);
async function execute(i) {
    return await baseAnalyze_1.baseAnalyze.call(this, i, 'imageUrls', 'image');
}
//# sourceMappingURL=analyze.operation.js.map