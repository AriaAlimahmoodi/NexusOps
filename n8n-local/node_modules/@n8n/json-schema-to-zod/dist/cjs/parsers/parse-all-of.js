"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseAllOf = parseAllOf;
const zod_1 = require("zod");
const parse_schema_1 = require("./parse-schema");
const half_1 = require("../utils/half");
const originalIndex = Symbol('Original index');
const ensureOriginalIndex = (arr) => {
    const newArr = [];
    for (let i = 0; i < arr.length; i++) {
        const item = arr[i];
        if (typeof item === 'boolean') {
            newArr.push(item ? { [originalIndex]: i } : { [originalIndex]: i, not: {} });
        }
        else if (originalIndex in item) {
            return arr;
        }
        else {
            newArr.push({ ...item, [originalIndex]: i });
        }
    }
    return newArr;
};
function parseAllOf(jsonSchema, refs) {
    if (jsonSchema.allOf.length === 0) {
        return zod_1.z.never();
    }
    if (jsonSchema.allOf.length === 1) {
        const item = jsonSchema.allOf[0];
        return (0, parse_schema_1.parseSchema)(item, {
            ...refs,
            path: [...refs.path, 'allOf', item[originalIndex]],
        });
    }
    const [left, right] = (0, half_1.half)(ensureOriginalIndex(jsonSchema.allOf));
    return zod_1.z.intersection(parseAllOf({ allOf: left }, refs), parseAllOf({ allOf: right }, refs));
}
