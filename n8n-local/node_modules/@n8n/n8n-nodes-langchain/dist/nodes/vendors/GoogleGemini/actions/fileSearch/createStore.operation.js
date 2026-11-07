"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.description = exports.properties = void 0;
exports.execute = execute;
const n8n_workflow_1 = require("n8n-workflow");
const utils_1 = require("../../helpers/utils");
exports.properties = [
    {
        displayName: 'Display Name',
        name: 'displayName',
        type: 'string',
        placeholder: 'e.g. My File Search Store',
        description: 'A human-readable name for the File Search store',
        default: '',
        required: true,
    },
];
const displayOptions = {
    show: {
        operation: ['createStore'],
        resource: ['fileSearch'],
    },
};
exports.description = (0, n8n_workflow_1.updateDisplayOptions)(displayOptions, exports.properties);
async function execute(i) {
    const displayName = this.getNodeParameter('displayName', i, '');
    const response = await utils_1.createFileSearchStore.call(this, displayName);
    return [
        {
            json: response,
            pairedItem: {
                item: i,
            },
        },
    ];
}
//# sourceMappingURL=createStore.operation.js.map