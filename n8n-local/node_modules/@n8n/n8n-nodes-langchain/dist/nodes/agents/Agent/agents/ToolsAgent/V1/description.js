"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toolsAgentProperties = void 0;
const options_1 = require("../options");
exports.toolsAgentProperties = [
    {
        displayName: 'Options',
        name: 'options',
        type: 'collection',
        displayOptions: {
            show: {
                agent: ['toolsAgent'],
            },
        },
        default: {},
        placeholder: 'Add Option',
        options: [...options_1.commonOptions],
    },
];
//# sourceMappingURL=description.js.map