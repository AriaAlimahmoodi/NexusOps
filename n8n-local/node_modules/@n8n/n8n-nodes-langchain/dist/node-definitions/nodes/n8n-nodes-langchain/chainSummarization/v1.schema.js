/**
 * Summarization Chain Node - Version 1 - Zod Validation Schemas
 *
 * These schemas validate node configuration at runtime.
 * Use .parse() for strict validation or .safeParse() for error handling.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

module.exports = function getSchema({ parameters, z, expressionSchema, stringOrExpression, numberOrExpression, booleanOrExpression, resourceLocatorValueSchema, resourceMapperValueSchema, filterValueSchema, assignmentCollectionValueSchema, iDataObjectSchema, languageModelInstanceSchema, documentLoaderInstanceSchema }) {

  // Static subnode schema
  const subnodesSchema = z.object({
    model: z.union([languageModelInstanceSchema, z.array(languageModelInstanceSchema)]).optional(),
    documentLoader: z.union([documentLoaderInstanceSchema, z.array(documentLoaderInstanceSchema)]).optional(),
  }).strict();

  // Parameters schema
  const parametersSchema = z.object({
    type: z.union([z.literal('map_reduce'), z.literal('refine'), z.literal('stuff'), expressionSchema]).optional(),
    options: z.object({ combineMapPrompt: stringOrExpression.optional(), prompt: stringOrExpression.optional(), refinePrompt: stringOrExpression.optional(), refineQuestionPrompt: stringOrExpression.optional() }).optional(),
  });

  // Return combined config schema
  return z.object({
    parameters: parametersSchema.nullable().optional(),
    subnodes: subnodesSchema.optional(),
  });
};