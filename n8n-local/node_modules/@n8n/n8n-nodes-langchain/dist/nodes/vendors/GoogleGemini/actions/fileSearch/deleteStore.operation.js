"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.description = exports.properties = void 0;
exports.execute = execute;
const n8n_workflow_1 = require("n8n-workflow");
const utils_1 = require("../../helpers/utils");
exports.properties = [
    {
        displayName: 'File Search Store Name',
        name: 'fileSearchStoreName',
        type: 'string',
        placeholder: 'e.g. fileSearchStores/abc123',
        description: 'The full name of the File Search store to delete (format: fileSearchStores/...)',
        default: '',
        required: true,
    },
    {
        displayName: 'Force Delete',
        name: 'force',
        type: 'boolean',
        description: 'Whether to delete related Documents and objects. If false, deletion will fail if the store contains any Documents.',
        default: false,
    },
];
const displayOptions = {
    show: {
        operation: ['deleteStore'],
        resource: ['fileSearch'],
    },
};
exports.description = (0, n8n_workflow_1.updateDisplayOptions)(displayOptions, exports.properties);
async function execute(i) {
    const fileSearchStoreName = this.getNodeParameter('fileSearchStoreName', i, '');
    const force = this.getNodeParameter('force', i, false);
    const response = await utils_1.deleteFileSearchStore.call(this, fileSearchStoreName, force);
    return [
        {
            json: response,
            pairedItem: {
                item: i,
            },
        },
    ];
}
//# sourceMappingURL=deleteStore.operation.js.map