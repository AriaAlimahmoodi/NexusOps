"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyDataTableReadParameters = applyDataTableReadParameters;
const workflow_sdk_1 = require("@n8n/workflow-sdk");
function applyDataTableReadParameters(node, items) {
    const read = (0, workflow_sdk_1.readDataTableReadParameters)(node);
    if (!read) {
        return {
            items,
            warnings: [
                `Pinned Data Table read "${node.name}": its filter parameters could not be read; rows were left as generated`,
            ],
            flags: [],
        };
    }
    const { matchType, conditions, returnAll, limit, sortBy } = read;
    const warnings = [];
    const evaluators = conditions.map((condition) => conditionPredicate(condition, node.name, warnings));
    const predicates = evaluators.filter((p) => p !== undefined);
    const allEvaluable = predicates.length === evaluators.length;
    let kept = items;
    if (predicates.length > 0) {
        kept = items.filter((item) => matchType === 'allConditions'
            ? predicates.every((p) => p(item.json))
            : !allEvaluable || predicates.some((p) => p(item.json)));
    }
    if (sortBy)
        kept = sortRows(kept, sortBy);
    if (!returnAll && limit !== undefined && allEvaluable)
        kept = kept.slice(0, limit);
    const flags = !allEvaluable && !returnAll && limit !== undefined && kept.length > limit ? warnings : [];
    return { items: kept, warnings, flags };
}
function conditionPredicate(condition, nodeName, warnings) {
    const { condition: operator } = condition;
    const key = (0, workflow_sdk_1.literalParameter)(condition.keyName);
    const value = (0, workflow_sdk_1.literalParameter)(condition.keyValue);
    if (key.isExpression || value.isExpression) {
        warnings.push(`Pinned Data Table read "${nodeName}": the condition on "${condition.keyName}" uses an expression that cannot be evaluated before the run; rows were not filtered by it`);
        return undefined;
    }
    const keyName = typeof key.literal === 'string' ? key.literal : condition.keyName;
    const keyValue = value.literal;
    switch (operator) {
        case 'isEmpty':
            return (row) => isEmptyCell(row[keyName]);
        case 'isNotEmpty':
            return (row) => !isEmptyCell(row[keyName]);
        case 'isTrue':
            return (row) => row[keyName] === true || row[keyName] === 'true';
        case 'isFalse':
            return (row) => row[keyName] === false || row[keyName] === 'false';
        case 'eq':
            return (row) => cellEquals(row[keyName], keyValue);
        case 'neq':
            return (row) => !cellEquals(row[keyName], keyValue);
        case 'gt':
        case 'gte':
        case 'lt':
        case 'lte':
            return (row) => compareCells(row[keyName], keyValue, operator);
        case 'like':
            return (row) => matchesLike(row[keyName], keyValue, true);
        case 'ilike':
            return (row) => matchesLike(row[keyName], keyValue, false);
        default:
            warnings.push(`Pinned Data Table read "${nodeName}": unknown condition "${operator}" on "${keyName}"; rows were not filtered by it`);
            return undefined;
    }
}
function sortRows(items, [column, direction]) {
    const sign = direction === 'ASC' ? 1 : -1;
    return [...items].sort((a, b) => {
        if (compareCells(a.json[column], b.json[column], 'lt'))
            return -sign;
        if (compareCells(a.json[column], b.json[column], 'gt'))
            return sign;
        return 0;
    });
}
function isEmptyCell(value) {
    return value === null || value === undefined || value === '';
}
function asText(value) {
    if (typeof value === 'string')
        return value;
    if (typeof value === 'number' || typeof value === 'boolean')
        return String(value);
    return undefined;
}
function asNumber(value) {
    if (typeof value === 'number')
        return Number.isFinite(value) ? value : undefined;
    if (typeof value === 'string' && value.trim() !== '') {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
}
function asDateMs(value) {
    if (value instanceof Date)
        return value.getTime();
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}/.test(value))
        return undefined;
    const ms = new Date(value).getTime();
    return Number.isNaN(ms) ? undefined : ms;
}
function cellEquals(cell, value) {
    const cellNull = cell === null || cell === undefined;
    const valueNull = value === null || value === undefined;
    if (cellNull || valueNull)
        return cellNull && valueNull;
    if (typeof cell === 'boolean' || typeof value === 'boolean') {
        return asText(cell) === asText(value);
    }
    const [a, b] = [asNumber(cell), asNumber(value)];
    if (a !== undefined && b !== undefined)
        return a === b;
    const [dateA, dateB] = [asDateMs(cell), asDateMs(value)];
    if (dateA !== undefined && dateB !== undefined)
        return dateA === dateB;
    const [textA, textB] = [asText(cell), asText(value)];
    return textA !== undefined && textB !== undefined && textA === textB;
}
function compareCells(cell, value, operator) {
    if (isEmptyCell(cell) || value === null || value === undefined)
        return false;
    const [a, b] = [asNumber(cell), asNumber(value)];
    const [dateA, dateB] = [asDateMs(cell), asDateMs(value)];
    const [textA, textB] = [asText(cell), asText(value)];
    let left;
    let right;
    if (a !== undefined && b !== undefined)
        [left, right] = [a, b];
    else if (dateA !== undefined && dateB !== undefined)
        [left, right] = [dateA, dateB];
    else if (textA !== undefined && textB !== undefined)
        [left, right] = [textA, textB];
    else
        return false;
    switch (operator) {
        case 'gt':
            return left > right;
        case 'gte':
            return left >= right;
        case 'lt':
            return left < right;
        case 'lte':
            return left <= right;
    }
}
function matchesLike(cell, value, caseSensitive) {
    const text = asText(cell);
    if (text === undefined || typeof value !== 'string')
        return false;
    const pattern = value.includes('%') ? value : `%${value}%`;
    const haystack = caseSensitive ? text : text.toLowerCase();
    const parts = (caseSensitive ? pattern : pattern.toLowerCase()).split('%');
    if (!haystack.startsWith(parts[0]))
        return false;
    let cursor = parts[0].length;
    for (const part of parts.slice(1, -1)) {
        const index = haystack.indexOf(part, cursor);
        if (index === -1)
            return false;
        cursor = index + part.length;
    }
    const tail = parts[parts.length - 1];
    return haystack.length - cursor >= tail.length && haystack.endsWith(tail);
}
//# sourceMappingURL=data-table-pin-filter.js.map