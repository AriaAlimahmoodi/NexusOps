"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseNumber = void 0;
const zod_1 = require("zod");
const extend_schema_1 = require("../utils/extend-schema");
const parseNumber = (jsonSchema) => {
    let zodSchema = zod_1.z.number();
    let isInteger = false;
    if (jsonSchema.type === 'integer') {
        isInteger = true;
        zodSchema = (0, extend_schema_1.extendSchemaWithMessage)(zodSchema, jsonSchema, 'type', (zs, _, errorMsg) => zs.int(errorMsg));
    }
    else if (jsonSchema.format === 'int64') {
        isInteger = true;
        zodSchema = (0, extend_schema_1.extendSchemaWithMessage)(zodSchema, jsonSchema, 'format', (zs, _, errorMsg) => zs.int(errorMsg));
    }
    zodSchema = (0, extend_schema_1.extendSchemaWithMessage)(zodSchema, jsonSchema, 'multipleOf', (zs, multipleOf, errorMsg) => {
        if (multipleOf === 1) {
            if (isInteger)
                return zs;
            return zs.int(errorMsg);
        }
        return zs.multipleOf(multipleOf, errorMsg);
    });
    if (typeof jsonSchema.minimum === 'number') {
        if (jsonSchema.exclusiveMinimum === true) {
            zodSchema = (0, extend_schema_1.extendSchemaWithMessage)(zodSchema, jsonSchema, 'minimum', (zs, minimum, errorMsg) => zs.gt(minimum, errorMsg));
        }
        else {
            zodSchema = (0, extend_schema_1.extendSchemaWithMessage)(zodSchema, jsonSchema, 'minimum', (zs, minimum, errorMsg) => zs.gte(minimum, errorMsg));
        }
    }
    else if (typeof jsonSchema.exclusiveMinimum === 'number') {
        zodSchema = (0, extend_schema_1.extendSchemaWithMessage)(zodSchema, jsonSchema, 'exclusiveMinimum', (zs, exclusiveMinimum, errorMsg) => zs.gt(exclusiveMinimum, errorMsg));
    }
    if (typeof jsonSchema.maximum === 'number') {
        if (jsonSchema.exclusiveMaximum === true) {
            zodSchema = (0, extend_schema_1.extendSchemaWithMessage)(zodSchema, jsonSchema, 'maximum', (zs, maximum, errorMsg) => zs.lt(maximum, errorMsg));
        }
        else {
            zodSchema = (0, extend_schema_1.extendSchemaWithMessage)(zodSchema, jsonSchema, 'maximum', (zs, maximum, errorMsg) => zs.lte(maximum, errorMsg));
        }
    }
    else if (typeof jsonSchema.exclusiveMaximum === 'number') {
        zodSchema = (0, extend_schema_1.extendSchemaWithMessage)(zodSchema, jsonSchema, 'exclusiveMaximum', (zs, exclusiveMaximum, errorMsg) => zs.lt(exclusiveMaximum, errorMsg));
    }
    return zodSchema;
};
exports.parseNumber = parseNumber;
