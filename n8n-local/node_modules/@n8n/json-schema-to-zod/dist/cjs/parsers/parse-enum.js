"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseEnum = void 0;
const zod_1 = require("zod");
const parseEnum = (jsonSchema) => {
    if (jsonSchema.enum.length === 0) {
        return zod_1.z.never();
    }
    if (jsonSchema.enum.length === 1) {
        // union does not work when there is only one element
        return zod_1.z.literal(jsonSchema.enum[0]);
    }
    if (jsonSchema.enum.every((x) => typeof x === 'string')) {
        return zod_1.z.enum(jsonSchema.enum);
    }
    return zod_1.z.union(jsonSchema.enum.map((x) => zod_1.z.literal(x)));
};
exports.parseEnum = parseEnum;
