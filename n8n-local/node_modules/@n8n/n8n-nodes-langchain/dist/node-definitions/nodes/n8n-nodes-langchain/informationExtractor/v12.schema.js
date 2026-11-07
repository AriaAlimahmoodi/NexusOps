/**
 * Information Extractor Node - Version 1.2 - Zod Validation Schemas
 *
 * These schemas validate node configuration at runtime.
 * Use .parse() for strict validation or .safeParse() for error handling.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

module.exports = function getSchema({ parameters, z, expressionSchema, stringOrExpression, numberOrExpression, booleanOrExpression, resourceLocatorValueSchema, resourceMapperValueSchema, filterValueSchema, assignmentCollectionValueSchema, iDataObjectSchema, resolveSchema, resolveOneOfSchemas, languageModelInstanceSchema }) {

  // Static subnode schema
  const subnodesSchema = z.object({
    model: z.union([languageModelInstanceSchema, z.array(languageModelInstanceSchema)]),
  }).strict();

  // Parameters schema
  const parametersSchema = z.object({
    text: stringOrExpression.optional(),
    schemaType: z.union([z.literal('fromAttributes'), z.literal('fromJson'), z.literal('manual')]).optional(),
    jsonSchemaExample: resolveSchema({ parameters, schema: z.union([iDataObjectSchema, z.string()]), required: false, displayOptions: {"show":{"schemaType":["fromJson"]}}, defaults: {"schemaType":"fromAttributes"} }),
    inputSchema: resolveSchema({ parameters, schema: z.union([iDataObjectSchema, z.string()]), required: false, displayOptions: {"show":{"schemaType":["manual"]}}, defaults: {"schemaType":"fromAttributes"} }),
    attributes: resolveSchema({ parameters, schema: z.object({ attributes: z.array(z.object({ name: stringOrExpression.optional(), type: z.union([z.literal('boolean'), z.literal('date'), z.literal('number'), z.literal('string'), expressionSchema]).optional(), description: stringOrExpression.optional(), required: booleanOrExpression.optional() })).optional() }), required: false, displayOptions: {"show":{"schemaType":["fromAttributes"]}}, defaults: {"schemaType":"fromAttributes"} }),
    options: z.object({ systemPromptTemplate: stringOrExpression.optional(), batching: z.object({ batchSize: numberOrExpression.optional(), delayBetweenBatches: numberOrExpression.optional() }).optional() }).optional(),
  });

  // Return combined config schema
  return z.object({
    parameters: parametersSchema.nullable().optional(),
    subnodes: subnodesSchema,
  });
};