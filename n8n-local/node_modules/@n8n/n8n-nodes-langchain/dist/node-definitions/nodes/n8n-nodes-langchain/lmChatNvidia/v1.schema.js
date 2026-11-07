/**
 * NVIDIA Nemotron Chat Model Node - Version 1 - Zod Validation Schemas
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
    model: z.union([z.literal('nvidia/llama-3.1-nemotron-nano-8b-v1'), z.literal('nvidia/llama-3.3-nemotron-super-49b-v1'), z.literal('nvidia/llama-3.3-nemotron-super-49b-v1.5'), z.literal('nvidia/nemotron-3-nano-30b-a3b'), z.literal('nvidia/nemotron-3-nano-omni-30b-a3b-reasoning'), z.literal('nvidia/nemotron-3-super-120b-a12b'), z.literal('nvidia/nemotron-nano-12b-v2-vl'), z.literal('nvidia/nvidia-nemotron-nano-9b-v2'), expressionSchema]).optional(),
    options: z.object({ frequencyPenalty: numberOrExpression.optional(), maxTokens: numberOrExpression.optional(), responseFormat: z.union([z.literal('text'), z.literal('json_object'), expressionSchema]).optional(), presencePenalty: numberOrExpression.optional(), temperature: numberOrExpression.optional(), timeout: numberOrExpression.optional(), maxRetries: numberOrExpression.optional(), topP: numberOrExpression.optional() }).optional(),
  });

  // Return combined config schema
  return z.object({
    parameters: parametersSchema.nullable().optional(),
  });
};