"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getToolsAgentProperties = void 0;
const ai_utilities_1 = require("@n8n/ai-utilities");
const options_1 = require("../options");
const enableStreaminOption = {
    displayName: 'Enable Streaming',
    name: 'enableStreaming',
    type: 'boolean',
    default: true,
    description: 'Whether this agent will stream the response in real-time as it generates text',
};
const getToolsAgentProperties = ({ withStreaming, }) => [
    {
        displayName: 'Options',
        name: 'options',
        type: 'collection',
        default: {},
        placeholder: 'Add Option',
        options: [
            ...options_1.commonOptions,
            (0, ai_utilities_1.getBatchingOptionFields)(undefined, 1),
            ...(withStreaming ? [enableStreaminOption] : []),
        ],
        displayOptions: {
            hide: {
                '@version': [{ _cnd: { lt: 2.2 } }],
            },
        },
    },
    {
        displayName: 'Options',
        name: 'options',
        type: 'collection',
        default: {},
        placeholder: 'Add Option',
        options: [...options_1.commonOptions, (0, ai_utilities_1.getBatchingOptionFields)(undefined, 1)],
        displayOptions: {
            show: {
                '@version': [{ _cnd: { lt: 2.2 } }],
            },
        },
    },
];
exports.getToolsAgentProperties = getToolsAgentProperties;
//# sourceMappingURL=description.js.map