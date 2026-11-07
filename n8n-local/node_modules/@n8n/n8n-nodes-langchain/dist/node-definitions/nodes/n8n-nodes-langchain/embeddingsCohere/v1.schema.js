/**
 * Embeddings Cohere Node - Version 1 - Zod Validation Schemas
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
    modelName: z.union([z.literal('embed-english-light-v2.0'), z.literal('embed-english-light-v3.0'), z.literal('embed-english-v2.0'), z.literal('embed-english-v3.0'), z.literal('embed-multilingual-light-v3.0'), z.literal('embed-multilingual-v2.0'), z.literal('embed-multilingual-v3.0'), expressionSchema]).optional(),
  });

  // Return combined config schema
  return z.object({
    parameters: parametersSchema.nullable().optional(),
  });
};