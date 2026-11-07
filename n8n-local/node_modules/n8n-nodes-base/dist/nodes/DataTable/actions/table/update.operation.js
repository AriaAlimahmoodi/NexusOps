"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.description = exports.FIELD = void 0;
exports.execute = execute;
const utils_1 = require("../../common/utils");
exports.FIELD = 'update';
const displayOptions = {
    show: {
        resource: ['table'],
        operation: [exports.FIELD],
    },
};
exports.description = [
    {
        displayName: 'New Name',
        name: 'newName',
        type: 'string',
        required: true,
        default: '',
        placeholder: 'e.g. Renamed Data Table',
        description: 'The new name for the data table',
        displayOptions,
    },
];
async function execute(index) {
    const newName = this.getNodeParameter('newName', index);
    const dataTableProxy = await (0, utils_1.getDataTableProxyExecute)(this, index);
    const success = await dataTableProxy.updateDataTable({ name: newName });
    return [{ json: { success, name: newName } }];
}
//# sourceMappingURL=update.operation.js.map