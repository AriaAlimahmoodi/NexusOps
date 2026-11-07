/**
 * Question and Answer Chain Node - Version 1.7 - Zod Validation Schemas
 *
 * These schemas validate node configuration at runtime.
 * Use .parse() for strict validation or .safeParse() for error handling.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

module.exports = function getSchema({ parameters, z, expressionSchema, stringOrExpression, numberOrExpression, booleanOrExpression, resourceLocatorValueSchema, resourceMapperValueSchema, filterValueSchema, assignmentCollectionValueSchema, iDataObjectSchema, resolveSchema, resolveOneOfSchemas, languageModelInstanceSchema, retrieverInstanceSchema }) {

  // Static subnode schema
  const subnodesSchema = z.object({
    model: z.union([languageModelInstanceSchema, z.array(languageModelInstanceSchema)]),
    retriever: retrieverInstanceSchema,
  }).strict();

  // Parameters schema
  const parametersSchema = z.object({
    promptType: z.union([z.literal('auto'), z.literal('define'), expressionSchema]).optional(),
    text: resolveSchema({ parameters, schema: stringOrExpression, required: true, displayOptions: {"show":{"promptType":["define"]}}, defaults: {"promptType":"auto"} }),
    options: z.object({ systemPromptTemplate: stringOrExpression.optional(), batching: z.object({ batchSize: numberOrExpression.optional(), delayBetweenBatches: numberOrExpression.optional() }).optional() }).optional(),
  });

  // Return combined config schema
  return z.object({
    parameters: parametersSchema.nullable().optional(),
    subnodes: subnodesSchema,
  });
};