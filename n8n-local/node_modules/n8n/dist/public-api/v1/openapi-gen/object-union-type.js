"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addObjectTypeToObjectUnions = addObjectTypeToObjectUnions;
const is_record_1 = require("@n8n/utils/is-record");
const DATA_VALUED_KEYS = new Set(['example', 'examples', 'default', 'enum']);
const SCHEMA_MAP_KEYS = new Set(['properties', 'patternProperties', '$defs', 'definitions']);
function addObjectTypeToObjectUnions(node) {
    if (Array.isArray(node)) {
        node.forEach((item) => addObjectTypeToObjectUnions(item));
        return;
    }
    if (!(0, is_record_1.isRecord)(node)) {
        return;
    }
    const members = node.oneOf;
    if (node.type === undefined &&
        Array.isArray(members) &&
        members.length > 0 &&
        members.every((member) => (0, is_record_1.isRecord)(member) && member.type === 'object')) {
        node.type = 'object';
    }
    for (const [key, value] of Object.entries(node)) {
        if (SCHEMA_MAP_KEYS.has(key) && (0, is_record_1.isRecord)(value)) {
            Object.values(value).forEach((schema) => addObjectTypeToObjectUnions(schema));
            continue;
        }
        if (DATA_VALUED_KEYS.has(key)) {
            continue;
        }
        addObjectTypeToObjectUnions(value);
    }
}
//# sourceMappingURL=object-union-type.js.map