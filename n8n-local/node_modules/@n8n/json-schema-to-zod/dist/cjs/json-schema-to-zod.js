"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jsonSchemaToZod = void 0;
const parse_schema_1 = require("./parsers/parse-schema");
const jsonSchemaToZod = (schema, options = {}) => {
    return (0, parse_schema_1.parseSchema)(schema, {
        path: [],
        seen: new Map(),
        ...options,
    });
};
exports.jsonSchemaToZod = jsonSchemaToZod;
