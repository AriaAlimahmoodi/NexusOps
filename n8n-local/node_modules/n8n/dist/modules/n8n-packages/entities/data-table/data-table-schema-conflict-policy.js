"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findSchemaConflict = findSchemaConflict;
const data_table_compat_1 = require("./data-table-compat");
const SCHEMA_CONFLICTS = {
    'keep-existing': data_table_compat_1.findSchemaIncompatibility,
    fail: (packageColumns, targetColumns) => {
        const incompatibility = (0, data_table_compat_1.findSchemaIncompatibility)(packageColumns, targetColumns);
        const packageColumnNames = new Set(packageColumns.map(({ name }) => name));
        const extraColumns = [...targetColumns]
            .sort((a, b) => a.index - b.index)
            .map(({ name }) => name)
            .filter((name) => !packageColumnNames.has(name));
        if (extraColumns.length === 0)
            return incompatibility;
        return { missingColumns: [], typeMismatches: [], ...incompatibility, extraColumns };
    },
    overwrite: () => null,
    'overwrite-non-destructive': (packageColumns, targetColumns) => {
        const destructive = (0, data_table_compat_1.diffDataTableColumns)(packageColumns, targetColumns).filter(({ destructive }) => destructive);
        if (destructive.length === 0)
            return null;
        const extraColumns = destructive.flatMap((operation) => operation.kind === 'remove-column' ? [operation.column] : []);
        return {
            missingColumns: [],
            typeMismatches: destructive.flatMap((operation) => operation.kind === 'change-column-type'
                ? [{ column: operation.column, expectedType: operation.to, actualType: operation.from }]
                : []),
            ...(extraColumns.length > 0 ? { extraColumns } : {}),
        };
    },
};
function findSchemaConflict(policy, packageColumns, targetColumns) {
    return SCHEMA_CONFLICTS[policy](packageColumns, targetColumns);
}
//# sourceMappingURL=data-table-schema-conflict-policy.js.map