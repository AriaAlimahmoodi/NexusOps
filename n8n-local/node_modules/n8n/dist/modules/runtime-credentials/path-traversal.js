"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractAndClear = extractAndClear;
function extractAndClear(obj, path) {
    const segments = path.split('.');
    const collected = [];
    walk(obj, segments, 0, collected);
    if (collected.length === 0)
        return undefined;
    if (collected.length === 1)
        return collected[0];
    return collected;
}
function isIDataObject(v) {
    return typeof v === 'object' && v !== null && !Array.isArray(v);
}
function walk(current, segments, index, collected) {
    if (!isIDataObject(current))
        return;
    const segment = segments[index];
    const isWildcard = segment.endsWith('[*]');
    const key = isWildcard ? segment.slice(0, -3) : segment;
    const isLast = index === segments.length - 1;
    if (isWildcard) {
        const arr = current[key];
        if (!Array.isArray(arr))
            return;
        const typedArr = arr;
        if (isLast) {
            for (let i = 0; i < typedArr.length; i++) {
                collected.push(typedArr[i]);
                typedArr[i] = undefined;
            }
        }
        else {
            for (const element of typedArr)
                walk(element, segments, index + 1, collected);
        }
        return;
    }
    if (!(key in current))
        return;
    if (isLast) {
        collected.push(current[key]);
        current[key] = undefined;
    }
    else {
        walk(current[key], segments, index + 1, collected);
    }
}
//# sourceMappingURL=path-traversal.js.map