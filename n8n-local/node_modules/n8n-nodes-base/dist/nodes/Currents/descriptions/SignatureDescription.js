"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signatureFields = exports.signatureOperations = void 0;
const common_descriptions_1 = require("./common.descriptions");
exports.signatureOperations = [
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
            show: {
                resource: ['signature'],
            },
        },
        options: [
            {
                name: 'Generate',
                value: 'generate',
                description: 'Generate a unique test signature',
                routing: {
                    request: {
                        method: 'POST',
                        url: '/signature/test',
                    },
                    output: {
                        postReceive: [
                            {
                                type: 'rootProperty',
                                properties: {
                                    property: 'data',
                                },
                            },
                        ],
                    },
                },
                action: 'Generate a signature',
            },
        ],
        default: 'generate',
    },
];
exports.signatureFields = [
    // ----------------------------------
    //         signature:generate
    // ----------------------------------
    {
        ...common_descriptions_1.projectRLC,
        displayOptions: {
            show: {
                resource: ['signature'],
                operation: ['generate'],
            },
        },
        routing: {
            send: {
                type: 'body',
                property: 'projectId',
                value: '={{ $value }}',
            },
        },
    },
    {
        displayName: 'Spec File Path',
        name: 'specFilePath',
        type: 'string',
        required: true,
        default: '',
        displayOptions: {
            show: {
                resource: ['signature'],
                operation: ['generate'],
            },
        },
        routing: {
            send: {
                type: 'body',
                property: 'specFilePath',
            },
        },
        placeholder: 'e.g., tests/e2e/login.spec.ts',
        description: 'The complete path to the spec file',
    },
    {
        displayName: 'Test Title',
        name: 'testTitle',
        type: 'string',
        required: true,
        default: '',
        displayOptions: {
            show: {
                resource: ['signature'],
                operation: ['generate'],
            },
        },
        routing: {
            send: {
                type: 'body',
                property: 'testTitle',
            },
        },
        placeholder: 'e.g., should login with valid credentials',
        description: 'The test title. For nested describe blocks, use " > " as separator (e.g., "Login > should login with valid credentials").',
    },
];
//# sourceMappingURL=SignatureDescription.js.map