"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findSchemaIncompatibility = findSchemaIncompatibility;
exports.diffDataTableSchema = diffDataTableSchema;
exports.diffDataTableColumns = diffDataTableColumns;
const pair_columns_1 = require("../../../../modules/data-table/utils/pair-columns");
function findSchemaIncompatibility(packageColumns, targetColumns) {
    const targetTypeByName = new Map(targetColumns.map((column) => [column.name, column.type]));
    const missingColumns = [];
    const typeMismatches = [];
    for (const column of packageColumns) {
        const targetType = targetTypeByName.get(column.name);
        if (targetType === undefined) {
            missingColumns.push(column.name);
        }
        else if (targetType !== column.type) {
            typeMismatches.push({
                column: column.name,
                expectedType: column.type,
                actualType: targetType,
            });
        }
    }
    if (missingColumns.length === 0 && typeMismatches.length === 0)
        return null;
    return { missingColumns, typeMismatches };
}
function diffDataTableSchema(packageTable, target) {
    const operations = diffDataTableColumns(packageTable.columns, target.columns);
    if (target.name !== packageTable.name) {
        operations.push({
            kind: 'rename-table',
            from: target.name,
            to: packageTable.name,
            destructive: false,
        });
    }
    return operations;
}
function diffDataTableColumns(packageColumns, targetColumns) {
    const { pairs, added, removed } = (0, pair_columns_1.pairDataTableColumns)(packageColumns, [...targetColumns].sort((a, b) => a.index - b.index));
    const operations = removed.map(({ name, type }) => ({
        kind: 'remove-column',
        column: name,
        type,
        destructive: true,
    }));
    for (const { source, target } of pairs) {
        if (source.type !== target.type) {
            operations.push({
                kind: 'change-column-type',
                column: source.name,
                from: target.type,
                to: source.type,
                destructive: true,
            });
        }
    }
    for (const { source, target } of pairs) {
        if (source.name !== target.name) {
            operations.push({
                kind: 'rename-column',
                from: target.name,
                to: source.name,
                destructive: false,
            });
        }
    }
    for (const { name, type } of added) {
        operations.push({ kind: 'add-column', column: name, type, destructive: false });
    }
    const isReordered = pairs.some(({ source }, position) => position > 0 && source.index <= pairs[position - 1].source.index);
    if (isReordered)
        operations.push({ kind: 'reorder-columns', destructive: false });
    return operations;
}
//# sourceMappingURL=data-table-compat.js.map