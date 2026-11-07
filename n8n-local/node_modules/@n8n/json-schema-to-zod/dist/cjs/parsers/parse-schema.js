"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseSchema = void 0;
const z = __importStar(require("zod"));
const parse_all_of_1 = require("./parse-all-of");
const parse_any_of_1 = require("./parse-any-of");
const parse_array_1 = require("./parse-array");
const parse_boolean_1 = require("./parse-boolean");
const parse_const_1 = require("./parse-const");
const parse_default_1 = require("./parse-default");
const parse_enum_1 = require("./parse-enum");
const parse_if_then_else_1 = require("./parse-if-then-else");
const parse_multiple_type_1 = require("./parse-multiple-type");
const parse_not_1 = require("./parse-not");
const parse_null_1 = require("./parse-null");
const parse_nullable_1 = require("./parse-nullable");
const parse_number_1 = require("./parse-number");
const parse_object_1 = require("./parse-object");
const parse_one_of_1 = require("./parse-one-of");
const parse_string_1 = require("./parse-string");
const its_1 = require("../utils/its");
const addDescribes = (jsonSchema, zodSchema) => {
    if (jsonSchema.description) {
        zodSchema = zodSchema.describe(jsonSchema.description);
    }
    return zodSchema;
};
const addDefaults = (jsonSchema, zodSchema) => {
    if (jsonSchema.default !== undefined) {
        zodSchema = zodSchema.default(jsonSchema.default);
    }
    return zodSchema;
};
const addAnnotations = (jsonSchema, zodSchema) => {
    if (jsonSchema.readOnly) {
        zodSchema = zodSchema.readonly();
    }
    return zodSchema;
};
const selectParser = (schema, refs) => {
    if (its_1.its.a.nullable(schema)) {
        return (0, parse_nullable_1.parseNullable)(schema, refs);
    }
    else if (its_1.its.an.object(schema)) {
        return (0, parse_object_1.parseObject)(schema, refs);
    }
    else if (its_1.its.an.array(schema)) {
        return (0, parse_array_1.parseArray)(schema, refs);
    }
    else if (its_1.its.an.anyOf(schema)) {
        return (0, parse_any_of_1.parseAnyOf)(schema, refs);
    }
    else if (its_1.its.an.allOf(schema)) {
        return (0, parse_all_of_1.parseAllOf)(schema, refs);
    }
    else if (its_1.its.a.oneOf(schema)) {
        return (0, parse_one_of_1.parseOneOf)(schema, refs);
    }
    else if (its_1.its.a.not(schema)) {
        return (0, parse_not_1.parseNot)(schema, refs);
    }
    else if (its_1.its.an.enum(schema)) {
        return (0, parse_enum_1.parseEnum)(schema); //<-- needs to come before primitives
    }
    else if (its_1.its.a.const(schema)) {
        return (0, parse_const_1.parseConst)(schema);
    }
    else if (its_1.its.a.multipleType(schema)) {
        return (0, parse_multiple_type_1.parseMultipleType)(schema, refs);
    }
    else if (its_1.its.a.primitive(schema, 'string')) {
        return (0, parse_string_1.parseString)(schema);
    }
    else if (its_1.its.a.primitive(schema, 'number') || its_1.its.a.primitive(schema, 'integer')) {
        return (0, parse_number_1.parseNumber)(schema);
    }
    else if (its_1.its.a.primitive(schema, 'boolean')) {
        return (0, parse_boolean_1.parseBoolean)(schema);
    }
    else if (its_1.its.a.primitive(schema, 'null')) {
        return (0, parse_null_1.parseNull)(schema);
    }
    else if (its_1.its.a.conditional(schema)) {
        return (0, parse_if_then_else_1.parseIfThenElse)(schema, refs);
    }
    else {
        return (0, parse_default_1.parseDefault)(schema);
    }
};
const parseSchema = (jsonSchema, refs = { seen: new Map(), path: [] }, blockMeta) => {
    if (typeof jsonSchema !== 'object')
        return jsonSchema ? z.any() : z.never();
    if (refs.parserOverride) {
        const custom = refs.parserOverride(jsonSchema, refs);
        if (custom instanceof z.ZodType) {
            return custom;
        }
    }
    let seen = refs.seen.get(jsonSchema);
    if (seen) {
        if (seen.r !== undefined) {
            return seen.r;
        }
        if (refs.depth === undefined || seen.n >= refs.depth) {
            return z.any();
        }
        seen.n += 1;
    }
    else {
        seen = { r: undefined, n: 0 };
        refs.seen.set(jsonSchema, seen);
    }
    let parsedZodSchema = selectParser(jsonSchema, refs);
    if (!blockMeta) {
        if (!refs.withoutDescribes) {
            parsedZodSchema = addDescribes(jsonSchema, parsedZodSchema);
        }
        if (!refs.withoutDefaults) {
            parsedZodSchema = addDefaults(jsonSchema, parsedZodSchema);
        }
        parsedZodSchema = addAnnotations(jsonSchema, parsedZodSchema);
    }
    seen.r = parsedZodSchema;
    return parsedZodSchema;
};
exports.parseSchema = parseSchema;
