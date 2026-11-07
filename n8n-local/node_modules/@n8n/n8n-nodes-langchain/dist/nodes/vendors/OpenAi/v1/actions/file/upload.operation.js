"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.description = void 0;
exports.execute = execute;
const form_data_1 = __importDefault(require("form-data"));
const n8n_workflow_1 = require("n8n-workflow");
const binary_data_1 = require("../../../helpers/binary-data");
const transport_1 = require("../../../transport");
const properties = [
    {
        displayName: 'Input Data Field Name',
        name: 'binaryPropertyName',
        type: 'string',
        default: 'data',
        hint: 'The name of the input field containing the binary file data to be processed',
        placeholder: 'e.g. data',
        description: 'Name of the binary property which contains the file. The size of individual files can be a maximum of 512 MB or 2 million tokens for Assistants.',
    },
    {
        displayName: 'Options',
        name: 'options',
        placeholder: 'Add Option',
        type: 'collection',
        default: {},
        options: [
            {
                displayName: 'Purpose',
                name: 'purpose',
                type: 'options',
                default: 'assistants',
                description: "The intended purpose of the uploaded file, the 'Fine-tuning' only supports .jsonl files",
                options: [
                    {
                        name: 'Assistants',
                        value: 'assistants',
                    },
                    {
                        name: 'Fine-Tune',
                        value: 'fine-tune',
                    },
                ],
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
exports.description = (0, n8n_workflow_1.updateDisplayOptions)(displayOptions, properties);
async function execute(i) {
    const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i);
    const options = this.getNodeParameter('options', i, {});
    const formData = new form_data_1.default();
    formData.append('purpose', options.purpose || 'assistants');
    const { filename, contentType, fileContent } = await (0, binary_data_1.getBinaryDataFile)(this, i, binaryPropertyName);
    formData.append('file', fileContent, {
        filename,
        contentType,
    });
    try {
        const response = await transport_1.apiRequest.call(this, 'POST', '/files', {
            option: { formData },
            headers: formData.getHeaders(),
        });
        return [
            {
                json: response,
                pairedItem: { item: i },
            },
        ];
    }
    catch (error) {
        if (error.message.includes('Bad request') &&
            error.description?.includes('Expected file to have JSONL format')) {
            throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'The file content is not in JSONL format', {
                description: 'Fine-tuning accepts only files in JSONL format, where every line is a valid JSON dictionary',
            });
        }
        throw error;
    }
}
//# sourceMappingURL=upload.operation.js.map