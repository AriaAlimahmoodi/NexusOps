"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseNot = void 0;
const zod_1 = require("zod");
const parse_schema_1 = require("./parse-schema");
const parseNot = (jsonSchema, refs) => {
    return zod_1.z.any().refine((value) => !(0, parse_schema_1.parseSchema)(jsonSchema.not, {
        ...refs,
        path: [...refs.path, 'not'],
    }).safeParse(value).success, 'Invalid input: Should NOT be valid against schema');
};
exports.parseNot = parseNot;
