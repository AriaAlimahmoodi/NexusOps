"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseOneOf = void 0;
const zod_1 = require("zod");
const parse_schema_1 = require("./parse-schema");
const parseOneOf = (jsonSchema, refs) => {
    if (!jsonSchema.oneOf.length) {
        return zod_1.z.any();
    }
    if (jsonSchema.oneOf.length === 1) {
        return (0, parse_schema_1.parseSchema)(jsonSchema.oneOf[0], {
            ...refs,
            path: [...refs.path, 'oneOf', 0],
        });
    }
    return zod_1.z.any().superRefine((x, ctx) => {
        const schemas = jsonSchema.oneOf.map((schema, i) => (0, parse_schema_1.parseSchema)(schema, {
            ...refs,
            path: [...refs.path, 'oneOf', i],
        }));
        const unionErrors = schemas.reduce((errors, schema) => ((result) => (result.error ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
        if (schemas.length - unionErrors.length !== 1) {
            ctx.addIssue({
                path: ctx.path,
                code: 'invalid_union',
                unionErrors,
                message: 'Invalid input: Should pass single schema',
            });
        }
    });
};
exports.parseOneOf = parseOneOf;
