/**
 * Summarization Chain Node - Version 2.1 - Zod Validation Schemas
 *
 * These schemas validate node configuration at runtime.
 * Use .parse() for strict validation or .safeParse() for error handling.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

module.exports = function getSchema({ parameters, z, expressionSchema, stringOrExpression, numberOrExpression, booleanOrExpression, resourceLocatorValueSchema, resourceMapperValueSchema, filterValueSchema, assignmentCollectionValueSchema, iDataObjectSchema, resolveSchema, resolveOneOfSchemas, languageModelInstanceSchema, documentLoaderInstanceSchema, textSplitterInstanceSchema }) {

  // Helper function for conditional subnode schema
  function getSubnodesSchema() {
    return z.object({
      model: z.union([languageModelInstanceSchema, z.array(languageModelInstanceSchema)]),
      documentLoader: resolveSchema({ parameters, schema: z.union([documentLoaderInstanceSchema, z.array(documentLoaderInstanceSchema)]), required: true, displayOptions: {"show":{"operationMode":["documentLoader"]}}, defaults: {"operationMode":"nodeInputJson"} }),
      textSplitter: resolveSchema({ parameters, schema: textSplitterInstanceSchema, required: false, displayOptions: {"show":{"chunkingMode":["advanced"]}}, defaults: {"chunkingMode":"simple"} }),
    }).strict();
  }

  // Parameters schema
  const parametersSchema = z.object({
    operationMode: z.union([z.literal('nodeInputJson'), z.literal('nodeInputBinary'), z.literal('documentLoader')]).optional(),
    chunkingMode: resolveSchema({ parameters, schema: z.union([z.literal('simple'), z.literal('advanced')]), required: false, displayOptions: {"show":{"/operationMode":["nodeInputJson","nodeInputBinary"]}} }),
    chunkSize: resolveSchema({ parameters, schema: numberOrExpression, required: false, displayOptions: {"show":{"/chunkingMode":["simple"]}} }),
    chunkOverlap: resolveSchema({ parameters, schema: numberOrExpression, required: false, displayOptions: {"show":{"/chunkingMode":["simple"]}} }),
    options: z.object({ binaryDataKey: stringOrExpression.optional(), summarizationMethodAndPrompts: z.object({ values: z.object({ summarizationMethod: z.union([z.literal('map_reduce'), z.literal('refine'), z.literal('stuff'), expressionSchema]).optional(), combineMapPrompt: stringOrExpression.optional(), prompt: stringOrExpression.optional(), refinePrompt: stringOrExpression.optional(), refineQuestionPrompt: stringOrExpression.optional() }).optional() }).optional(), batching: z.object({ batchSize: numberOrExpression.optional(), delayBetweenBatches: numberOrExpression.optional() }).optional() }).optional(),
  });

  // Return combined config schema
  return z.object({
    parameters: parametersSchema.nullable().optional(),
    subnodes: getSubnodesSchema(),
  });
};