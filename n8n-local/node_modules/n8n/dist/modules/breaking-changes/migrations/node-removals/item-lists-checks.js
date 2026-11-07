"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertIncludeEmptyIsInert = assertIncludeEmptyIsInert;
exports.assertNoSplitBy = assertNoSplitBy;
exports.assertNoEmptyFieldToSplitOut = assertNoEmptyFieldToSplitOut;
const parameter_readers_1 = require("../parameter-readers");
function assertIncludeEmptyIsInert(node) {
    const { fieldsToSummarize } = node.parameters;
    const entries = (0, parameter_readers_1.asParameters)(fieldsToSummarize)?.values;
    if (!Array.isArray(entries))
        return;
    for (const entry of entries.map(parameter_readers_1.asParameters)) {
        if (!entry)
            continue;
        const aggregation = entry.aggregation ?? 'count';
        const ignoredByItemLists = aggregation === 'count' || aggregation === 'countUnique' || (0, parameter_readers_1.isExpression)(aggregation);
        if (!ignoredByItemLists)
            continue;
        if (entry.includeEmpty !== undefined && entry.includeEmpty !== false) {
            throw new Error('"Include Empty Values" is turned on for a field. The old node ignored this setting for Count and Count Unique, but the new node uses it, so your results could change. Turn it off or replace this node by hand.');
        }
    }
}
function assertNoSplitBy(node) {
    const { fieldsToSplitBy } = node.parameters;
    if (fieldsToSplitBy === undefined)
        return;
    if (typeof fieldsToSplitBy !== 'string' || (0, parameter_readers_1.isExpression)(fieldsToSplitBy)) {
        throw new Error('"Fields to Split By" is an expression or has an unsupported value. Replace this node by hand.');
    }
    if (fieldsToSplitBy.split(',').some((field) => field.trim() !== '')) {
        throw new Error('"Fields to Split By" is set. The new Summarize node can return the groups in a different order, and numbers stay numbers where the old node returned text. Replace this node by hand.');
    }
}
function assertNoEmptyFieldToSplitOut(node) {
    const { fieldToSplitOut = '' } = node.parameters;
    if (typeof fieldToSplitOut !== 'string') {
        throw new Error('"Field to Split Out" could not be read. Open the node, check this field and migrate again.');
    }
    if ((0, parameter_readers_1.isExpression)(fieldToSplitOut))
        return;
    if (fieldToSplitOut.split(',').some((field) => field.trim() === '')) {
        throw new Error('"Field to Split Out" is empty or has an empty name in the list, for example "a,,b". The new node ignores empty names, so the result could change. Remove the empty name or replace this node by hand.');
    }
}
//# sourceMappingURL=item-lists-checks.js.map