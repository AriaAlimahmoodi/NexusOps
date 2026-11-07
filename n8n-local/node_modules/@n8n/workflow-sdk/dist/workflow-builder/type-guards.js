"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSplitInBatchesBuilder = isSplitInBatchesBuilder;
exports.extractSplitInBatchesBuilder = extractSplitInBatchesBuilder;
exports.isSwitchCaseComposite = isSwitchCaseComposite;
exports.isIfElseComposite = isIfElseComposite;
function getObjectProperty(obj, key) {
    return obj[key];
}
function isSplitInBatchesBuilder(value) {
    if (value === null || typeof value !== 'object')
        return false;
    if ('sibNode' in value && '_doneNodes' in value && '_eachNodes' in value) {
        return true;
    }
    if ('_parent' in value && '_nodes' in value) {
        const parent = getObjectProperty(value, '_parent');
        return (parent !== null &&
            typeof parent === 'object' &&
            'sibNode' in parent &&
            '_doneNodes' in parent &&
            '_eachNodes' in parent);
    }
    return false;
}
function extractSplitInBatchesBuilder(value) {
    if (value === null || typeof value !== 'object') {
        throw new Error('extractSplitInBatchesBuilder requires a non-null object');
    }
    if ('sibNode' in value) {
        return value;
    }
    if ('_parent' in value) {
        return getObjectProperty(value, '_parent');
    }
    throw new Error('extractSplitInBatchesBuilder: value is not a valid builder or chain');
}
function isSwitchCaseComposite(value) {
    if (value === null || typeof value !== 'object')
        return false;
    return 'switchNode' in value && 'cases' in value;
}
function isIfElseComposite(value) {
    if (value === null || typeof value !== 'object')
        return false;
    return 'ifNode' in value && 'trueBranch' in value;
}
//# sourceMappingURL=type-guards.js.map