"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseIfThenElse = void 0;
const zod_1 = require("zod");
const parse_schema_1 = require("./parse-schema");
const parseIfThenElse = (jsonSchema, refs) => {
    const $if = (0, parse_schema_1.parseSchema)(jsonSchema.if, { ...refs, path: [...refs.path, 'if'] });
    const $then = (0, parse_schema_1.parseSchema)(jsonSchema.then, {
        ...refs,
        path: [...refs.path, 'then'],
    });
    const $else = (0, parse_schema_1.parseSchema)(jsonSchema.else, {
        ...refs,
        path: [...refs.path, 'else'],
    });
    return zod_1.z.union([$then, $else]).superRefine((value, ctx) => {
        const result = $if.safeParse(value).success ? $then.safeParse(value) : $else.safeParse(value);
        if (!result.success) {
            result.error.errors.forEach((error) => ctx.addIssue(error));
        }
    });
};
exports.parseIfThenElse = parseIfThenElse;
