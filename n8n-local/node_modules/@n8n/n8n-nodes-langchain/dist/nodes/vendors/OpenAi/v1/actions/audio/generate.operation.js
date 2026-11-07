"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.description = void 0;
exports.execute = execute;
const n8n_workflow_1 = require("n8n-workflow");
const transport_1 = require("../../../transport");
const properties = [
    {
        displayName: 'Model',
        name: 'model',
        type: 'options',
        default: 'tts-1',
        options: [
            {
                name: 'TTS-1',
                value: 'tts-1',
            },
            {
                name: 'TTS-1-HD',
                value: 'tts-1-hd',
            },
        ],
    },
    {
        displayName: 'Text Input',
        name: 'input',
        type: 'string',
        placeholder: 'e.g. The quick brown fox jumped over the lazy dog',
        description: 'The text to generate audio for. The maximum length is 4096 characters.',
        default: '',
        typeOptions: {
            rows: 2,
        },
    },
    {
        displayName: 'Voice',
        name: 'voice',
        type: 'options',
        default: 'alloy',
        description: 'The voice to use when generating the audio',
        options: [
            {
                name: 'Alloy',
                value: 'alloy',
            },
            {
                name: 'Echo',
                value: 'echo',
            },
            {
                name: 'Fable',
                value: 'fable',
            },
            {
                name: 'Nova',
                value: 'nova',
            },
            {
                name: 'Onyx',
                value: 'onyx',
            },
            {
                name: 'Shimmer',
                value: 'shimmer',
            },
        ],
    },
    {
        displayName: 'Options',
        name: 'options',
        placeholder: 'Add Option',
        type: 'collection',
        default: {},
        options: [
            {
                displayName: 'Response Format',
                name: 'response_format',
                type: 'options',
                default: 'mp3',
                options: [
                    {
                        name: 'MP3',
                        value: 'mp3',
                    },
                    {
                        name: 'OPUS',
                        value: 'opus',
                    },
                    {
                        name: 'AAC',
                        value: 'aac',
                    },
                    {
                        name: 'FLAC',
                        value: 'flac',
                    },
                ],
            },
            {
                displayName: 'Audio Speed',
                name: 'speed',
                type: 'number',
                default: 1,
                typeOptions: {
                    minValue: 0.25,
                    maxValue: 4,
                    numberPrecision: 1,
                },
            },
            {
                displayName: 'Put Output in Field',
                name: 'binaryPropertyOutput',
                type: 'string',
                default: 'data',
                hint: 'The name of the output field to put the binary file data in',
            },
        ],
    },
];
const displayOptions = {
    show: {
        operation: ['generate'],
        resource: ['audio'],
    },
};
exports.description = (0, n8n_workflow_1.updateDisplayOptions)(displayOptions, properties);
async function execute(i) {
    const model = this.getNodeParameter('model', i);
    const input = this.getNodeParameter('input', i);
    const voice = this.getNodeParameter('voice', i);
    let response_format = 'mp3';
    let speed = 1;
    const options = this.getNodeParameter('options', i, {});
    if (options.response_format) {
        response_format = options.response_format;
    }
    if (options.speed) {
        speed = options.speed;
    }
    const body = {
        model,
        input,
        voice,
        response_format,
        speed,
    };
    const option = {
        useStream: true,
        returnFullResponse: true,
        encoding: 'arraybuffer',
        json: false,
    };
    const response = await transport_1.apiRequest.call(this, 'POST', '/audio/speech', { body, option });
    const binaryData = await this.helpers.prepareBinaryData(response, `audio.${response_format}`, `audio/${response_format}`);
    const binaryPropertyOutput = options.binaryPropertyOutput || 'data';
    const newItem = {
        json: {
            ...binaryData,
            data: undefined,
        },
        pairedItem: { item: i },
        binary: {
            [binaryPropertyOutput]: binaryData,
        },
    };
    return [newItem];
}
//# sourceMappingURL=generate.operation.js.map