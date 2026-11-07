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
exports.parseObject = parseObject;
const z = __importStar(require("zod"));
const parse_all_of_1 = require("./parse-all-of");
const parse_any_of_1 = require("./parse-any-of");
const parse_one_of_1 = require("./parse-one-of");
const parse_schema_1 = require("./parse-schema");
const its_1 = require("../utils/its");
function parseObjectProperties(objectSchema, refs) {
    if (!objectSchema.properties) {
        return undefined;
    }
    const propertyKeys = Object.keys(objectSchema.properties);
    if (propertyKeys.length === 0) {
        return z.object({});
    }
    const properties = {};
    for (const key of propertyKeys) {
        const propJsonSchema = objectSchema.properties[key];
        const propZodSchema = (0, parse_schema_1.parseSchema)(propJsonSchema, {
            ...refs,
            path: [...refs.path, 'properties', key],
        });
        const hasDefault = typeof propJsonSchema === 'object' && propJsonSchema.default !== undefined;
        const required = Array.isArray(objectSchema.required)
            ? objectSchema.required.includes(key)
            : typeof propJsonSchema === 'object' && propJsonSchema.required === true;
        const isOptional = !hasDefault && !required;
        properties[key] = isOptional ? propZodSchema.optional() : propZodSchema;
    }
    return z.object(properties);
}
function parseObject(objectSchema, refs) {
    const hasPatternProperties = Object.keys(objectSchema.patternProperties ?? {}).length > 0;
    const propertiesSchema = parseObjectProperties(objectSchema, refs);
    let zodSchema = propertiesSchema;
    const additionalProperties = objectSchema.additionalProperties !== undefined
        ? (0, parse_schema_1.parseSchema)(objectSchema.additionalProperties, {
            ...refs,
            path: [...refs.path, 'additionalProperties'],
        })
        : undefined;
    if (objectSchema.patternProperties) {
        const parsedPatternProperties = Object.fromEntries(Object.entries(objectSchema.patternProperties).map(([key, value]) => {
            return [
                key,
                (0, parse_schema_1.parseSchema)(value, {
                    ...refs,
                    path: [...refs.path, 'patternProperties', key],
                }),
            ];
        }));
        const patternPropertyValues = Object.values(parsedPatternProperties);
        if (propertiesSchema) {
            if (additionalProperties) {
                zodSchema = propertiesSchema.catchall(z.union([...patternPropertyValues, additionalProperties]));
            }
            else if (Object.keys(parsedPatternProperties).length > 1) {
                zodSchema = propertiesSchema.catchall(z.union(patternPropertyValues));
            }
            else {
                zodSchema = propertiesSchema.catchall(patternPropertyValues[0]);
            }
        }
        else {
            if (additionalProperties) {
                zodSchema = z.record(z.union([...patternPropertyValues, additionalProperties]));
            }
            else if (patternPropertyValues.length > 1) {
                zodSchema = z.record(z.union(patternPropertyValues));
            }
            else {
                zodSchema = z.record(patternPropertyValues[0]);
            }
        }
        const objectPropertyKeys = new Set(Object.keys(objectSchema.properties ?? {}));
        zodSchema = zodSchema.superRefine((value, ctx) => {
            for (const key in value) {
                let wasMatched = objectPropertyKeys.has(key);
                for (const patternPropertyKey in objectSchema.patternProperties) {
                    const regex = new RegExp(patternPropertyKey);
                    if (key.match(regex)) {
                        wasMatched = true;
                        const result = parsedPatternProperties[patternPropertyKey].safeParse(value[key]);
                        if (!result.success) {
                            ctx.addIssue({
                                path: [...ctx.path, key],
                                code: 'custom',
                                message: `Invalid input: Key matching regex /${key}/ must match schema`,
                                params: {
                                    issues: result.error.issues,
                                },
                            });
                        }
                    }
                }
                if (!wasMatched && additionalProperties) {
                    const result = additionalProperties.safeParse(value[key]);
                    if (!result.success) {
                        ctx.addIssue({
                            path: [...ctx.path, key],
                            code: 'custom',
                            message: 'Invalid input: must match catchall schema',
                            params: {
                                issues: result.error.issues,
                            },
                        });
                    }
                }
            }
        });
    }
    let output;
    if (propertiesSchema) {
        if (hasPatternProperties) {
            output = zodSchema;
        }
        else if (additionalProperties) {
            if (additionalProperties instanceof z.ZodNever) {
                output = propertiesSchema.strict();
            }
            else {
                output = propertiesSchema.catchall(additionalProperties);
            }
        }
        else {
            output = zodSchema;
        }
    }
    else {
        if (hasPatternProperties) {
            output = zodSchema;
        }
        else if (additionalProperties) {
            output = z.record(additionalProperties);
        }
        else {
            output = z.record(z.any());
        }
    }
    if (its_1.its.an.anyOf(objectSchema)) {
        output = output.and((0, parse_any_of_1.parseAnyOf)({
            ...objectSchema,
            anyOf: objectSchema.anyOf.map((x) => typeof x === 'object' &&
                !x.type &&
                (x.properties ?? x.additionalProperties ?? x.patternProperties)
                ? { ...x, type: 'object' }
                : x),
        }, refs));
    }
    if (its_1.its.a.oneOf(objectSchema)) {
        output = output.and((0, parse_one_of_1.parseOneOf)({
            ...objectSchema,
            oneOf: objectSchema.oneOf.map((x) => typeof x === 'object' &&
                !x.type &&
                (x.properties ?? x.additionalProperties ?? x.patternProperties)
                ? { ...x, type: 'object' }
                : x),
        }, refs));
    }
    if (its_1.its.an.allOf(objectSchema)) {
        output = output.and((0, parse_all_of_1.parseAllOf)({
            ...objectSchema,
            allOf: objectSchema.allOf.map((x) => typeof x === 'object' &&
                !x.type &&
                (x.properties ?? x.additionalProperties ?? x.patternProperties)
                ? { ...x, type: 'object' }
                : x),
        }, refs));
    }
    return output;
}
