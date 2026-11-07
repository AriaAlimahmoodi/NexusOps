"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.iDataObjectSchema = exports.assignmentCollectionValueSchema = exports.assignmentSchema = exports.filterValueSchema = exports.filterConditionSchema = exports.filterOperatorSchema = exports.resourceLocatorValueSchema = exports.booleanOrExpression = exports.numberOrExpression = exports.stringOrExpression = exports.expressionSchema = exports.expressionPattern = void 0;
exports.literalUnion = literalUnion;
exports.optionsWithExpression = optionsWithExpression;
exports.multiOptionsSchema = multiOptionsSchema;
const zod_1 = require("zod");
exports.expressionPattern = /^={{.*}}$/s;
exports.expressionSchema = zod_1.z
    .string()
    .regex(exports.expressionPattern, 'Must be an n8n expression (={{...}})');
exports.stringOrExpression = zod_1.z.string();
exports.numberOrExpression = zod_1.z.union([zod_1.z.number(), exports.expressionSchema]);
exports.booleanOrExpression = zod_1.z.union([zod_1.z.boolean(), exports.expressionSchema]);
const resourceLocatorObjectSchema = zod_1.z.object({
    __rl: zod_1.z.literal(true),
    mode: zod_1.z.string(),
    value: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]),
    cachedResultName: zod_1.z.string().optional(),
    cachedResultUrl: zod_1.z.string().optional(),
});
exports.resourceLocatorValueSchema = zod_1.z.union([resourceLocatorObjectSchema, exports.expressionSchema]);
exports.filterOperatorSchema = zod_1.z.object({
    type: zod_1.z.string(),
    operation: zod_1.z.string(),
    singleValue: zod_1.z.boolean().optional(),
});
exports.filterConditionSchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    leftValue: zod_1.z.unknown(),
    operator: exports.filterOperatorSchema,
    rightValue: zod_1.z.unknown().optional(),
});
exports.filterValueSchema = zod_1.z.object({
    conditions: zod_1.z.array(exports.filterConditionSchema),
    combinator: zod_1.z.enum(['and', 'or']).optional(),
});
exports.assignmentSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    value: zod_1.z.unknown(),
    type: zod_1.z.string().optional(),
});
exports.assignmentCollectionValueSchema = zod_1.z.object({
    assignments: zod_1.z.array(exports.assignmentSchema),
});
exports.iDataObjectSchema = zod_1.z.record(zod_1.z.string(), zod_1.z.unknown());
function literalUnion(values) {
    if (values.length === 0) {
        throw new Error('literalUnion requires at least one value');
    }
    if (values.length === 1) {
        return zod_1.z.literal(values[0]);
    }
    const [first, second, ...rest] = values.map((v) => zod_1.z.literal(v));
    return zod_1.z.union([first, second, ...rest]);
}
function optionsWithExpression(values) {
    if (values.length === 0) {
        return exports.stringOrExpression;
    }
    const literalSchemas = values.map((v) => zod_1.z.literal(v));
    const [first, ...rest] = literalSchemas;
    return zod_1.z.union([first, exports.expressionSchema, ...rest]);
}
function multiOptionsSchema(values) {
    if (values.length === 0) {
        return zod_1.z.array(zod_1.z.string());
    }
    if (values.length === 1) {
        return zod_1.z.array(zod_1.z.literal(values[0]));
    }
    const [first, second, ...rest] = values.map((v) => zod_1.z.literal(v));
    return zod_1.z.array(zod_1.z.union([first, second, ...rest]));
}
//# sourceMappingURL=zod-helpers.js.map