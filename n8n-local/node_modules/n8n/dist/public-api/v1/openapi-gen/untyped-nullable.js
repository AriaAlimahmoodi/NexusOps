"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripUntypedNullable = stripUntypedNullable;
const is_record_1 = require("@n8n/utils/is-record");
const DATA_VALUED_KEYS = new Set(['example', 'examples', 'default', 'enum']);
const COMPOSITION_KEYS = ['$ref', 'allOf', 'anyOf', 'oneOf', 'not'];
function stripUntypedNullable(node) {
    if (Array.isArray(node)) {
        node.forEach((item) => stripUntypedNullable(item));
        return;
    }
    if (!(0, is_record_1.isRecord)(node)) {
        return;
    }
    const declaresNullable = typeof node.nullable === 'boolean';
    const isComposed = COMPOSITION_KEYS.some((key) => key in node);
    if (declaresNullable && node.type === undefined && !isComposed) {
        delete node.nullable;
    }
    for (const [key, value] of Object.entries(node)) {
        if (DATA_VALUED_KEYS.has(key)) {
            continue;
        }
        stripUntypedNullable(value);
    }
}
//# sourceMappingURL=untyped-nullable.js.map