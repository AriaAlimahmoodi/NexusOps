"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QUERY_WHEN_TRUNCATED_HINT = exports.ITEM_SHAPE_HINT = exports.MAX_OUTPUT_CHARS = exports.MAX_ITEMS = void 0;
exports.toSafeItem = toSafeItem;
exports.trimItems = trimItems;
exports.runQuery = runQuery;
exports.queryItems = queryItems;
const n8n_workflow_1 = require("n8n-workflow");
exports.MAX_ITEMS = 20;
exports.MAX_OUTPUT_CHARS = 50_000;
exports.ITEM_SHAPE_HINT = 'The data is a JSON array of item objects; index the first item as `[0]`, not `items[0]`, ' +
    'and read its fields under `json` — e.g. `[0].json`, `[0].json.fieldName`, `[*].json.fieldName`. ' +
    'Any binary fields are listed by name under `binary`.';
exports.QUERY_WHEN_TRUNCATED_HINT = 'Use only when a previous non-query result came back truncated — never re-query data you already received in full.';
function toSafeItem(item) {
    const safe = { json: item.json };
    if (item.binary) {
        safe.binary = Object.keys(item.binary);
    }
    return safe;
}
function trimItems(allItems) {
    const items = [];
    let itemPreviewed = false;
    let serializedSize = 0;
    for (const item of allItems.slice(0, exports.MAX_ITEMS)) {
        const safe = toSafeItem(item);
        const safeSize = JSON.stringify(safe).length;
        if (serializedSize + safeSize > exports.MAX_OUTPUT_CHARS) {
            if (items.length === 0) {
                items.push({
                    jsonPreview: JSON.stringify(item.json).slice(0, exports.MAX_OUTPUT_CHARS),
                    itemTruncated: true,
                });
                itemPreviewed = true;
            }
            break;
        }
        serializedSize += safeSize;
        items.push(safe);
    }
    return { items, truncated: itemPreviewed || items.length < allItems.length };
}
function runQuery(data, query) {
    let result;
    try {
        result = (0, n8n_workflow_1.evaluateJmespathQuery)(data, query);
    }
    catch (error) {
        return { error: `Query failed: ${error.message}` };
    }
    if (result === null || result === undefined) {
        return { error: `Query '${query}' matched no data.` };
    }
    const serialized = JSON.stringify(result);
    if (serialized.length > exports.MAX_OUTPUT_CHARS) {
        return { result: serialized.slice(0, exports.MAX_OUTPUT_CHARS), truncated: true };
    }
    return { result, truncated: false };
}
function queryItems(items, query) {
    return runQuery(items.map(toSafeItem), query);
}
//# sourceMappingURL=agent-data-utils.js.map