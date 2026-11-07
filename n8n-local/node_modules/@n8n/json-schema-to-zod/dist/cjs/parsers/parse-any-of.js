"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseAnyOf = void 0;
const zod_1 = require("zod");
const parse_schema_1 = require("./parse-schema");
const parseAnyOf = (jsonSchema, refs) => {
    return jsonSchema.anyOf.length
        ? jsonSchema.anyOf.length === 1
            ? (0, parse_schema_1.parseSchema)(jsonSchema.anyOf[0], {
                ...refs,
                path: [...refs.path, 'anyOf', 0],
            })
            : zod_1.z.union(jsonSchema.anyOf.map((schema, i) => (0, parse_schema_1.parseSchema)(schema, { ...refs, path: [...refs.path, 'anyOf', i] })))
        : zod_1.z.any();
};
exports.parseAnyOf = parseAnyOf;
