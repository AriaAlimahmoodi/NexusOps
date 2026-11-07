"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseNullable = void 0;
const parse_schema_1 = require("./parse-schema");
const omit_1 = require("../utils/omit");
/**
 * For compatibility with open api 3.0 nullable
 */
const parseNullable = (jsonSchema, refs) => {
    return (0, parse_schema_1.parseSchema)((0, omit_1.omit)(jsonSchema, 'nullable'), refs, true).nullable();
};
exports.parseNullable = parseNullable;
