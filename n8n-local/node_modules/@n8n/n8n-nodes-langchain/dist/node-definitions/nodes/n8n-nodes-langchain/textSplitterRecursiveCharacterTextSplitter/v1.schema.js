/**
 * Recursive Character Text Splitter Node - Version 1 - Zod Validation Schemas
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
    chunkSize: numberOrExpression.optional(),
    chunkOverlap: numberOrExpression.optional(),
    options: z.object({ splitCode: z.union([z.literal('cpp'), z.literal('go'), z.literal('java'), z.literal('js'), z.literal('php'), z.literal('proto'), z.literal('python'), z.literal('rst'), z.literal('ruby'), z.literal('rust'), z.literal('scala'), z.literal('swift'), z.literal('markdown'), z.literal('latex'), z.literal('html'), expressionSchema]).optional() }).optional(),
  });

  // Return combined config schema
  return z.object({
    parameters: parametersSchema.nullable().optional(),
  });
};