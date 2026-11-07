"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseArray = void 0;
const zod_1 = require("zod");
const parse_schema_1 = require("./parse-schema");
const extend_schema_1 = require("../utils/extend-schema");
const parseArray = (jsonSchema, refs) => {
    if (Array.isArray(jsonSchema.items)) {
        return zod_1.z.tuple(jsonSchema.items.map((v, i) => (0, parse_schema_1.parseSchema)(v, { ...refs, path: [...refs.path, 'items', i] })));
    }
    let zodSchema = !jsonSchema.items
        ? zod_1.z.array(zod_1.z.any())
        : zod_1.z.array((0, parse_schema_1.parseSchema)(jsonSchema.items, { ...refs, path: [...refs.path, 'items'] }));
    zodSchema = (0, extend_schema_1.extendSchemaWithMessage)(zodSchema, jsonSchema, 'minItems', (zs, minItems, errorMessage) => zs.min(minItems, errorMessage));
    zodSchema = (0, extend_schema_1.extendSchemaWithMessage)(zodSchema, jsonSchema, 'maxItems', (zs, maxItems, errorMessage) => zs.max(maxItems, errorMessage));
    return zodSchema;
};
exports.parseArray = parseArray;
