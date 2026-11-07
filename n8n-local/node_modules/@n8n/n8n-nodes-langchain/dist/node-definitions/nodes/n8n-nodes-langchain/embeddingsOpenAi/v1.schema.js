/**
 * Embeddings OpenAI Node - Version 1 - Zod Validation Schemas
 *
 * These schemas validate node configuration at runtime.
 * Use .parse() for strict validation or .safeParse() for error handling.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

module.exports = function getSchema({ parameters, z, expressionSchema, stringOrExpression, numberOrExpression, booleanOrExpression, resourceLocatorValueSchema, resourceMapperValueSchema, filterValueSchema, assignmentCollectionValueSchema, iDataObjectSchema }) {

  // Parameters schema
  const parametersSchema = z.object({
    model: stringOrExpression.optional(),
    options: z.object({ dimensions: z.union([z.literal(256), z.literal(512), z.literal(1024), z.literal(1536), z.literal(3072), expressionSchema]).optional(), baseURL: stringOrExpression.optional(), batchSize: numberOrExpression.optional(), stripNewLines: booleanOrExpression.optional(), timeout: numberOrExpression.optional(), encodingFormat: z.union([z.literal('float'), z.literal('base64'), expressionSchema]).optional() }).optional(),
  });

  // Return combined config schema
  return z.object({
    parameters: parametersSchema.nullable().optional(),
  });
};