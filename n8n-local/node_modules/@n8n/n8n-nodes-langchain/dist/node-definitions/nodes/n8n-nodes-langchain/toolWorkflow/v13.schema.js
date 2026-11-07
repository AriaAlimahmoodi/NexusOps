/**
 * Call n8n Workflow Tool Node - Version 1.3 - Zod Validation Schemas
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
    workflowJson: resolveSchema({ parameters, schema: z.union([iDataObjectSchema, z.string()]), required: false, displayOptions: {"show":{"source":["parameter"]}}, defaults: {"source":"database"} }),
    fields: z.object({ values: z.array(z.object({ name: stringOrExpression.optional(), type: z.union([z.literal('stringValue'), z.literal('numberValue'), z.literal('booleanValue'), z.literal('arrayValue'), z.literal('objectValue'), expressionSchema]).optional(), stringValue: stringOrExpression.optional(), numberValue: stringOrExpression.optional(), booleanValue: z.union([z.literal('true'), z.literal('false'), expressionSchema]).optional(), arrayValue: stringOrExpression.optional(), objectValue: z.union([iDataObjectSchema, z.string()]).optional() })).optional() }).optional(),
    specifyInputSchema: z.boolean().optional(),
    schemaType: resolveSchema({ parameters, schema: z.union([z.literal('fromJson'), z.literal('manual')]), required: false, displayOptions: {"show":{"specifyInputSchema":[true]}}, defaults: {"specifyInputSchema":false} }),
    jsonSchemaExample: resolveSchema({ parameters, schema: z.union([iDataObjectSchema, z.string()]), required: false, displayOptions: {"show":{"schemaType":["fromJson"]}}, defaults: {"schemaType":"fromJson"} }),
    inputSchema: resolveSchema({ parameters, schema: z.union([iDataObjectSchema, z.string()]), required: false, displayOptions: {"show":{"schemaType":["manual"]}}, defaults: {"schemaType":"fromJson"} }),
  });

  // Return combined config schema
  return z.object({
    parameters: parametersSchema.nullable().optional(),
  });
};