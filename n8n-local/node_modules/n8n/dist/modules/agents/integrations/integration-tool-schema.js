"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_BATCH_OPERATIONS = void 0;
exports.buildContextInputSchema = buildContextInputSchema;
exports.buildActionInputSchema = buildActionInputSchema;
exports.toSingleContextOperation = toSingleContextOperation;
exports.toSingleActionOperation = toSingleActionOperation;
const zod_1 = require("zod");
exports.MAX_BATCH_OPERATIONS = 20;
function buildContextInputSchema(definitions) {
    const definitionsByName = toDefinitionMap(definitions);
    const querySchema = zod_1.z.enum(toZodEnumValues(definitions.map((definition) => definition.name)));
    const operationSchema = zod_1.z
        .object({
        query: querySchema,
        input: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
    })
        .strict();
    return zod_1.z
        .object({
        query: querySchema.optional(),
        input: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
        queries: zod_1.z.array(operationSchema).min(1).max(exports.MAX_BATCH_OPERATIONS).optional(),
    })
        .strict()
        .superRefine((input, ctx) => {
        if (input.queries !== undefined) {
            if (input.query !== undefined || input.input !== undefined) {
                ctx.addIssue({
                    code: zod_1.z.ZodIssueCode.custom,
                    message: 'Provide either query/input or queries, not both.',
                });
            }
            input.queries.forEach((operation, index) => {
                validateOperationSchema(definitionsByName, { query: operation.query, input: operation.input ?? {} }, ctx, ['queries', index]);
            });
            return;
        }
        if (input.query === undefined) {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                message: 'Provide a query, or provide queries for a batch.',
            });
            return;
        }
        validateOperationSchema(definitionsByName, { query: input.query, input: input.input ?? {} }, ctx);
    });
}
function buildActionInputSchema(definitions) {
    const definitionsByName = toDefinitionMap(definitions);
    const actionSchema = zod_1.z.enum(toZodEnumValues(definitions.map((definition) => definition.name)));
    const operationSchema = zod_1.z
        .object({
        action: actionSchema,
        input: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
    })
        .strict();
    return zod_1.z
        .object({
        action: actionSchema.optional(),
        input: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
        actions: zod_1.z.array(operationSchema).min(1).max(exports.MAX_BATCH_OPERATIONS).optional(),
    })
        .strict()
        .superRefine((input, ctx) => {
        if (input.actions !== undefined) {
            if (input.action !== undefined || input.input !== undefined) {
                ctx.addIssue({
                    code: zod_1.z.ZodIssueCode.custom,
                    message: 'Provide either action/input or actions, not both.',
                });
            }
            input.actions.forEach((operation, index) => {
                validateOperationSchema(definitionsByName, { action: operation.action, input: operation.input ?? {} }, ctx, ['actions', index]);
            });
            return;
        }
        if (input.action === undefined) {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                message: 'Provide an action, or provide actions for a batch.',
            });
            return;
        }
        validateOperationSchema(definitionsByName, { action: input.action, input: input.input ?? {} }, ctx);
    });
}
function toSingleContextOperation(input) {
    if (input.query === undefined) {
        throw new Error('Integration context tool input was not validated.');
    }
    return { query: input.query, input: input.input ?? {} };
}
function toSingleActionOperation(input) {
    if (input.action === undefined) {
        throw new Error('Integration action tool input was not validated.');
    }
    return { action: input.action, input: normalizeActionInput(input.input ?? {}) };
}
function validateOperationSchema(definitionsByName, operation, ctx, pathPrefix = []) {
    const operationName = 'query' in operation ? operation.query : operation.action;
    const definition = definitionsByName.get(operationName);
    if (!definition) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            path: pathPrefix,
            message: `Unknown integration tool operation: ${operationName}`,
        });
        return;
    }
    const normalizedOperation = 'action' in operation
        ? { ...operation, input: normalizeActionInput(operation.input) }
        : operation;
    const result = definition.inputSchema.safeParse(normalizedOperation);
    if (!result.success)
        addSchemaIssues(ctx, result.error, pathPrefix);
}
function normalizeActionInput(input) {
    return typeof input.message === 'string' ? { ...input, message: { text: input.message } } : input;
}
function addSchemaIssues(ctx, error, pathPrefix = []) {
    for (const issue of error.issues) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            path: [...pathPrefix, ...issue.path],
            message: issue.message,
        });
    }
}
function toZodEnumValues(values) {
    if (values.length === 0) {
        throw new Error('Integration tools require at least one operation.');
    }
    return values;
}
function toDefinitionMap(definitions) {
    const definitionsByName = new Map();
    for (const definition of definitions) {
        if (definitionsByName.has(definition.name)) {
            throw new Error(`Duplicate integration tool operation definition: ${definition.name}`);
        }
        definitionsByName.set(definition.name, definition);
    }
    return definitionsByName;
}
//# sourceMappingURL=integration-tool-schema.js.map