"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toDslColumns = toDslColumns;
exports.isValidColumnName = isValidColumnName;
exports.isValidDataTableId = isValidDataTableId;
exports.addColumnQuery = addColumnQuery;
exports.deleteColumnQuery = deleteColumnQuery;
exports.renameColumnQuery = renameColumnQuery;
exports.renameTableQuery = renameTableQuery;
exports.quoteIdentifier = quoteIdentifier;
exports.extractReturningData = extractReturningData;
exports.extractInsertedIds = extractInsertedIds;
exports.normalizeDate = normalizeDate;
exports.normalizeRows = normalizeRows;
exports.normalizeValueForDatabase = normalizeValueForDatabase;
exports.normalizeUserRowValueForDatabase = normalizeUserRowValueForDatabase;
exports.toSqliteGlobFromPercent = toSqliteGlobFromPercent;
exports.escapeLikeSpecials = escapeLikeSpecials;
exports.toTableName = toTableName;
exports.toTableId = toTableId;
const api_types_1 = require("@n8n/api-types");
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const errors_1 = require("@n8n/errors");
function toDslColumns(columns) {
    return columns.map((col) => {
        const name = new db_1.DslColumn(col.name.trim());
        switch (col.type) {
            case 'number':
                return name.double;
            case 'boolean':
                return name.bool;
            case 'string':
                return name.text;
            case 'date':
                return name.timestampTimezone();
            default:
                return name.text;
        }
    });
}
function dataTableColumnTypeToSql(type, dbType) {
    switch (type) {
        case 'string':
            return 'TEXT';
        case 'number':
            switch (dbType) {
                case 'postgres':
                    return 'DOUBLE PRECISION';
                case 'sqlite':
                    return 'REAL';
                default:
                    return 'DOUBLE';
            }
        case 'boolean':
            return 'BOOLEAN';
        case 'date':
            if (dbType === 'postgres') {
                return 'TIMESTAMPTZ';
            }
            return 'DATETIME';
        default:
            throw new errors_1.NotFoundError(`Unsupported field type: ${type}`);
    }
}
function columnToWildcardAndType(column, dbType) {
    return `${quoteIdentifier(column.name, dbType)} ${dataTableColumnTypeToSql(column.type, dbType)}`;
}
function isValidColumnName(name) {
    return api_types_1.dataTableColumnNameSchema.safeParse(name).success;
}
function isValidDataTableId(id) {
    return api_types_1.dataTableIdSchema.safeParse(id).success;
}
function addColumnQuery(tableName, column, dbType) {
    if (!isValidColumnName(column.name)) {
        throw new n8n_workflow_1.UnexpectedError(api_types_1.DATA_TABLE_COLUMN_ERROR_MESSAGE);
    }
    const quotedTableName = quoteIdentifier(tableName, dbType);
    return `ALTER TABLE ${quotedTableName} ADD ${columnToWildcardAndType(column, dbType)}`;
}
function deleteColumnQuery(tableName, column, dbType) {
    const quotedTableName = quoteIdentifier(tableName, dbType);
    return `ALTER TABLE ${quotedTableName} DROP COLUMN ${quoteIdentifier(column, dbType)}`;
}
function renameColumnQuery(tableName, oldColumnName, newColumnName, dbType) {
    if (!isValidColumnName(oldColumnName) || !isValidColumnName(newColumnName)) {
        throw new n8n_workflow_1.UnexpectedError(api_types_1.DATA_TABLE_COLUMN_ERROR_MESSAGE);
    }
    const quotedTableName = quoteIdentifier(tableName, dbType);
    const quotedOldName = quoteIdentifier(oldColumnName, dbType);
    const quotedNewName = quoteIdentifier(newColumnName, dbType);
    return `ALTER TABLE ${quotedTableName} RENAME COLUMN ${quotedOldName} TO ${quotedNewName}`;
}
function renameTableQuery(oldTableName, newTableName, dbType) {
    return `ALTER TABLE ${quoteIdentifier(oldTableName, dbType)} RENAME TO ${quoteIdentifier(newTableName, dbType)}`;
}
function quoteIdentifier(name, dbType) {
    switch (dbType) {
        case 'postgres':
        case 'sqlite':
        default:
            return `"${name.replace(/"/g, '""')}"`;
    }
}
const isArrayOf = (data, itemGuard) => Array.isArray(data) && data.every(itemGuard);
const isNumber = (value) => {
    return typeof value === 'number' && Number.isFinite(value);
};
const isDate = (value) => {
    return value instanceof Date;
};
function hasRowReturnData(data) {
    return (typeof data === 'object' &&
        data !== null &&
        'id' in data &&
        isNumber(data.id) &&
        'createdAt' in data &&
        (isDate(data.createdAt) || typeof data.createdAt === 'string') &&
        'updatedAt' in data &&
        (isDate(data.updatedAt) || typeof data.updatedAt === 'string'));
}
function hasRowId(data) {
    return typeof data === 'object' && data !== null && 'id' in data && isNumber(data.id);
}
function extractReturningData(raw) {
    if (!isArrayOf(raw, hasRowReturnData)) {
        throw new n8n_workflow_1.UnexpectedError(`Expected INSERT INTO raw to be { id: number; createdAt: string; updatedAt: string }[] on Postgres. Is '${JSON.stringify(raw)}'`);
    }
    return raw;
}
function extractInsertedIds(raw, dbType) {
    switch (dbType) {
        case 'postgres': {
            if (!isArrayOf(raw, hasRowId)) {
                throw new n8n_workflow_1.UnexpectedError(`Expected INSERT INTO raw to be { id: number }[] on Postgres. Is '${JSON.stringify(raw)}'`);
            }
            return raw.map((r) => r.id);
        }
        case 'sqlite':
        default: {
            if (!isNumber(raw)) {
                throw new n8n_workflow_1.UnexpectedError('Expected INSERT INTO raw to be a number for SQLite');
            }
            return [raw];
        }
    }
}
function normalizeBoolean(value) {
    if (typeof value === 'boolean')
        return value;
    if (value === 1 || value === '1')
        return true;
    if (value === 0 || value === '0')
        return false;
    return value;
}
function dateStringHasExplicitTimezone(dateString) {
    const separatorIndex = dateString.includes('T')
        ? dateString.indexOf('T')
        : dateString.search(/\s/);
    if (separatorIndex === -1)
        return false;
    const timePart = dateString.slice(separatorIndex + 1);
    if (!timePart.includes(':'))
        return false;
    return (timePart.endsWith('Z') ||
        timePart.endsWith('z') ||
        timePart.includes('+') ||
        timePart.includes('-'));
}
function normalizeDate(value) {
    if (value instanceof Date)
        return value;
    if (typeof value === 'string') {
        const dateString = value.trim();
        const parsed = new Date(dateStringHasExplicitTimezone(dateString) ? dateString : `${dateString}Z`);
        if (!isNaN(parsed.getTime()))
            return parsed;
    }
    if (typeof value === 'number') {
        const parsed = new Date(value);
        if (!isNaN(parsed.getTime()))
            return parsed;
    }
    return null;
}
function normalizeRows(rows, columns) {
    const typeMap = {
        ...Object.fromEntries(columns.map((col) => [col.name, col.type])),
        ...n8n_workflow_1.DATA_TABLE_SYSTEM_COLUMN_TYPE_MAP,
    };
    return rows.map((row) => {
        const { id, createdAt, updatedAt, ...rest } = row;
        const normalized = {
            ...rest,
            id,
            createdAt: normalizeDate(createdAt) ?? new Date(),
            updatedAt: normalizeDate(updatedAt) ?? new Date(),
        };
        for (const [key, value] of Object.entries(rest)) {
            const type = typeMap[key];
            if (type === 'boolean') {
                normalized[key] = normalizeBoolean(value);
            }
            if (type === 'date' && value !== null && value !== undefined) {
                normalized[key] = normalizeDate(value) ?? value;
            }
        }
        return normalized;
    });
}
function formatDateForDatabase(value, dbType) {
    let date;
    if (value instanceof Date) {
        date = value;
    }
    else if (typeof value === 'string') {
        date = new Date(value);
    }
    else {
        throw new n8n_workflow_1.UnexpectedError(`Expected Date object or ISO date string, got ${typeof value}: ${String(value)}`);
    }
    if (isNaN(date.getTime())) {
        throw new n8n_workflow_1.UnexpectedError(`Invalid date: ${String(value)}`);
    }
    if (dbType && ['sqlite', 'sqlite-pooled'].includes(dbType)) {
        return date.toISOString().replace('T', ' ').replace('Z', '');
    }
    return date.toISOString();
}
function normalizeValueForDatabase(value, columnType, dbType) {
    if (columnType === 'date' && value !== null) {
        return formatDateForDatabase(value, dbType);
    }
    return value;
}
function normalizeUserRowValueForDatabase(value, columnType, dbType) {
    if (value === null || value === undefined)
        return null;
    if (columnType === 'boolean') {
        return normalizeBoolean(value);
    }
    if (columnType === 'date') {
        const date = normalizeDate(value);
        if (date === null)
            return value;
        return normalizeValueForDatabase(date, columnType, dbType);
    }
    return value;
}
function toSqliteGlobFromPercent(input) {
    const out = [];
    for (const ch of String(input ?? '')) {
        if (ch === '%')
            out.push('*');
        else if (ch === '[')
            out.push('[[]');
        else if (ch === ']')
            out.push('[]]');
        else if (ch === '*')
            out.push('[*]');
        else if (ch === '?')
            out.push('[?]');
        else
            out.push(ch);
    }
    return out.join('');
}
function escapeLikeSpecials(input) {
    return input
        .replace(/\\/g, '\\\\')
        .replace(/_/g, '\\_');
}
function toTableName(dataTableId) {
    const { tablePrefix } = di_1.Container.get(config_1.GlobalConfig).database;
    return `${tablePrefix}data_table_user_${dataTableId}`;
}
function toTableId(tableName) {
    return tableName.replace(/.*data_table_user_/, '');
}
//# sourceMappingURL=sql-utils.js.map