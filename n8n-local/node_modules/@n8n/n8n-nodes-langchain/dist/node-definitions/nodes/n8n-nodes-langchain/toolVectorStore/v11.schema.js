/**
 * Vector Store Question Answer Tool Node - Version 1.1 - Zod Validation Schemas
 *
 * These schemas validate node configuration at runtime.
 * Use .parse() for strict validation or .safeParse() for error handling.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

module.exports = function getSchema({ parameters, z, expressionSchema, stringOrExpression, numberOrExpression, booleanOrExpression, resourceLocatorValueSchema, resourceMapperValueSchema, filterValueSchema, assignmentCollectionValueSchema, iDataObjectSchema, vectorStoreInstanceSchema, languageModelInstanceSchema }) {

  // Static subnode schema
  const subnodesSchema = z.object({
    vectorStore: vectorStoreInstanceSchema,
    model: z.union([languageModelInstanceSchema, z.array(languageModelInstanceSchema)]),
  }).strict();

  // Parameters schema
  const parametersSchema = z.object({
    description: stringOrExpression.optional(),
    topK: numberOrExpression.optional(),
  });

  // Return combined config schema
  return z.object({
    parameters: parametersSchema.nullable().optional(),
    subnodes: subnodesSchema,
  });
};