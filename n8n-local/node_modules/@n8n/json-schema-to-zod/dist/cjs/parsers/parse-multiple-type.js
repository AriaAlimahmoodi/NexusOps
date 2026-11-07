"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseMultipleType = void 0;
const zod_1 = require("zod");
const parse_schema_1 = require("./parse-schema");
const parseMultipleType = (jsonSchema, refs) => {
    return zod_1.z.union(jsonSchema.type.map((type) => (0, parse_schema_1.parseSchema)({ ...jsonSchema, type }, refs)));
};
exports.parseMultipleType = parseMultipleType;
