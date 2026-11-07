"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.description = exports.FIELD = void 0;
exports.execute = execute;
const fields_1 = require("../../common/fields");
const utils_1 = require("../../common/utils");
exports.FIELD = 'delete';
const displayOptions = {
    show: {
        resource: ['table'],
        operation: [exports.FIELD],
    },
};
exports.description = [
    {
        displayName: 'This will permanently delete the data table and all its data. This action cannot be undone.',
        name: 'deleteWarning',
        type: 'notice',
        default: '',
        displayOptions,
    },
];
async function execute(index) {
    const dataTableId = this.getNodeParameter(fields_1.DATA_TABLE_ID_FIELD, index, undefined, {
        extractValue: true,
    });
    const dataTableProxy = await (0, utils_1.getDataTableProxyExecute)(this, index);
    const success = await dataTableProxy.deleteDataTable();
    return [{ json: { success, deletedTableId: dataTableId } }];
}
//# sourceMappingURL=delete.operation.js.map