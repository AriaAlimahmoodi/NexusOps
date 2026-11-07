/**
 * Ollama Model Node - Version 1 - Zod Validation Schemas
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
    options: z.object({ think: booleanOrExpression.optional(), temperature: numberOrExpression.optional(), topK: numberOrExpression.optional(), topP: numberOrExpression.optional(), frequencyPenalty: numberOrExpression.optional(), keepAlive: stringOrExpression.optional(), lowVram: booleanOrExpression.optional(), mainGpu: numberOrExpression.optional(), numBatch: numberOrExpression.optional(), numCtx: numberOrExpression.optional(), numGpu: numberOrExpression.optional(), numPredict: numberOrExpression.optional(), numThread: numberOrExpression.optional(), penalizeNewline: booleanOrExpression.optional(), presencePenalty: numberOrExpression.optional(), repeatPenalty: numberOrExpression.optional(), useMLock: booleanOrExpression.optional(), useMMap: booleanOrExpression.optional(), vocabOnly: booleanOrExpression.optional(), format: z.union([z.literal('default'), z.literal('json'), expressionSchema]).optional() }).optional(),
  });

  // Return combined config schema
  return z.object({
    parameters: parametersSchema.nullable().optional(),
  });
};