"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseString = void 0;
const zod_1 = require("zod");
const extend_schema_1 = require("../utils/extend-schema");
const parseString = (jsonSchema) => {
    let zodSchema = zod_1.z.string();
    zodSchema = (0, extend_schema_1.extendSchemaWithMessage)(zodSchema, jsonSchema, 'format', (zs, format, errorMsg) => {
        switch (format) {
            case 'email':
                return zs.email(errorMsg);
            case 'ip':
                return zs.ip(errorMsg);
            case 'ipv4':
                return zs.ip({ version: 'v4', message: errorMsg });
            case 'ipv6':
                return zs.ip({ version: 'v6', message: errorMsg });
            case 'uri':
                return zs.url(errorMsg);
            case 'uuid':
                return zs.uuid(errorMsg);
            case 'date-time':
                return zs.datetime({ offset: true, message: errorMsg });
            case 'time':
                return zs.time(errorMsg);
            case 'date':
                return zs.date(errorMsg);
            case 'binary':
                return zs.base64(errorMsg);
            case 'duration':
                return zs.duration(errorMsg);
            default:
                return zs;
        }
    });
    zodSchema = (0, extend_schema_1.extendSchemaWithMessage)(zodSchema, jsonSchema, 'contentEncoding', (zs, _, errorMsg) => zs.base64(errorMsg));
    zodSchema = (0, extend_schema_1.extendSchemaWithMessage)(zodSchema, jsonSchema, 'pattern', (zs, pattern, errorMsg) => zs.regex(new RegExp(pattern), errorMsg));
    zodSchema = (0, extend_schema_1.extendSchemaWithMessage)(zodSchema, jsonSchema, 'minLength', (zs, minLength, errorMsg) => zs.min(minLength, errorMsg));
    zodSchema = (0, extend_schema_1.extendSchemaWithMessage)(zodSchema, jsonSchema, 'maxLength', (zs, maxLength, errorMsg) => zs.max(maxLength, errorMsg));
    return zodSchema;
};
exports.parseString = parseString;
