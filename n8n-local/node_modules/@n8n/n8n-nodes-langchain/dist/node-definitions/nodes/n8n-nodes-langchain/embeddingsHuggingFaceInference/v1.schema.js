/**
 * Embeddings Hugging Face Inference Node - Version 1 - Zod Validation Schemas
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
    modelName: stringOrExpression.optional(),
    options: z.object({ endpointUrl: stringOrExpression.optional(), provider: z.union([z.literal('black-forest-labs'), z.literal('cerebras'), z.literal('cohere'), z.literal('fal-ai'), z.literal('featherless-ai'), z.literal('fireworks-ai'), z.literal('groq'), z.literal('hf-inference'), z.literal('hyperbolic'), z.literal('nebius'), z.literal('novita'), z.literal('nscale'), z.literal('openai'), z.literal('ovhcloud'), z.literal('replicate'), z.literal('sambanova'), z.literal('together'), z.literal('auto'), expressionSchema]).optional() }).optional(),
  });

  // Return combined config schema
  return z.object({
    parameters: parametersSchema.nullable().optional(),
  });
};