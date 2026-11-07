/**
 * Call n8n Workflow Tool Node - Version 2 - Zod Validation Schemas
 *
 * These schemas validate node configuration at runtime.
 * Use .parse() for strict validation or .safeParse() for error handling.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

module.exports = function getSchema({ parameters, z, expressionSchema, stringOrExpression, numberOrExpression, booleanOrExpression, resourceLocatorValueSchema, resourceMapperValueSchema, filterValueSchema, assignmentCollectionValueSchema, iDataObjectSchema, resolveSchema, resolveOneOfSchemas }) {

  // Parameters schema
  const parametersSchema = z.object({
    name: stringOrExpression.optional(),
    description: stringOrExpression.optional(),
    source: z.union([z.literal('database'), z.literal('parameter'), expressionSchema]).optional(),
    workflowId: resolveSchema({ parameters, schema: z.union([z.object({ __rl: z.literal(true), mode: z.union([z.literal('list'), z.literal('id')]), value: z.union([z.string(), z.number()]), cachedResultName: z.string().optional(), cachedResultUrl: z.string().optional() }), expressionSchema]), required: false, displayOptions: {"show":{"source":["database"]}}, defaults: {"source":"database"} }),
    workflowInputs: resolveSchema({ parameters, schema: resourceMapperValueSchema, required: false, displayOptions: {"show":{"source":["database"]},"hide":{"workflowId":[""]}}, defaults: {"source":"database","workflowId":""} }),
    workflowJson: resolveSchema({ parameters, schema: z.union([iDataObjectSchema, z.string()]), required: false, displayOptions: {"show":{"source":["parameter"]}}, defaults: {"source":"database"} }),
  });

  // Return combined config schema
  return z.object({
    parameters: parametersSchema.nullable().optional(),
  });
};