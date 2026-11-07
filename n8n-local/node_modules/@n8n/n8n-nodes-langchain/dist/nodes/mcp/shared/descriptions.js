"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.credentials = exports.transportSelect = void 0;
const transportSelect = ({ defaultOption, displayOptions, }) => ({
    displayName: 'Server Transport',
    name: 'serverTransport',
    type: 'options',
    options: [
        {
            name: 'HTTP Streamable',
            value: 'httpStreamable',
        },
        {
            name: 'Server Sent Events (Deprecated)',
            value: 'sse',
        },
    ],
    default: defaultOption,
    description: 'The transport used by your endpoint',
    displayOptions,
});
exports.transportSelect = transportSelect;
exports.credentials = [
    {
        name: 'httpBearerAuth',
        required: true,
        displayOptions: {
            show: {
                authentication: ['bearerAuth'],
            },
        },
    },
    {
        name: 'httpHeaderAuth',
        required: true,
        displayOptions: {
            show: {
                authentication: ['headerAuth'],
            },
        },
    },
    {
        name: 'mcpOAuth2Api',
        required: true,
        displayOptions: {
            show: {
                authentication: ['mcpOAuth2Api'],
            },
        },
    },
    {
        name: 'httpMultipleHeadersAuth',
        required: true,
        displayOptions: {
            show: {
                authentication: ['multipleHeadersAuth'],
            },
        },
    },
];
//# sourceMappingURL=descriptions.js.map