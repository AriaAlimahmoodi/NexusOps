"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertSchemaWriteAccess = assertSchemaWriteAccess;
exports.assertRowReadAccessIfReturningRows = assertRowReadAccessIfReturningRows;
const constants_1 = require("../../constants");
const errors_1 = require("@n8n/errors");
const check_access_1 = require("../../permissions.ee/check-access");
function assertSchemaWriteAccess(instanceWriteAccess) {
    if (instanceWriteAccess.isReadOnly()) {
        throw new errors_1.ForbiddenError('Cannot change the data table structure on a protected instance. This instance is in read-only mode. Rows can still be edited.');
    }
}
async function assertRowReadAccessIfReturningRows(user, dataTableId, { dryRun, returnData }) {
    if (!dryRun && !returnData)
        return;
    if (!(await (0, check_access_1.userHasScopes)(user, ['dataTable:readRow'], false, { dataTableId }))) {
        throw new errors_1.ForbiddenError(constants_1.RESPONSE_ERROR_MESSAGES.MISSING_SCOPE);
    }
}
//# sourceMappingURL=data-table-permissions.js.map