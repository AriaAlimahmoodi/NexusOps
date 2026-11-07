"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findIntroducedNameClashes = findIntroducedNameClashes;
exports.renameIntroducesClash = renameIntroducesClash;
exports.findNameClashGroups = findNameClashGroups;
const api_types_1 = require("@n8n/api-types");
function findIntroducedNameClashes(existing, added) {
    const taken = new Set(existing.map(api_types_1.skillNameKey));
    const clashes = [];
    for (const name of added) {
        const key = (0, api_types_1.skillNameKey)(name);
        if (taken.has(key))
            clashes.push(name);
        taken.add(key);
    }
    return clashes;
}
function renameIntroducesClash(otherNames, oldName, newName) {
    const newKey = (0, api_types_1.skillNameKey)(newName);
    if (newKey === (0, api_types_1.skillNameKey)(oldName))
        return false;
    return otherNames.some((name) => (0, api_types_1.skillNameKey)(name) === newKey);
}
function findNameClashGroups(names) {
    const byKey = new Map();
    for (const name of names) {
        const key = (0, api_types_1.skillNameKey)(name);
        byKey.set(key, [...(byKey.get(key) ?? []), name]);
    }
    return [...byKey.values()].filter((group) => group.length > 1);
}
//# sourceMappingURL=skill-names.js.map