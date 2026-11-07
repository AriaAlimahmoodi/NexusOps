/**
 * OpenAI Node - Version 2.1 - Zod Schema
 * Discriminator: resource=audio, operation=generate
 *
 * Use .parse() for strict validation or .safeParse() for error handling.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

module.exports = function getSchema({ parameters, z, expressionSchema, stringOrExpression, numberOrExpression, booleanOrExpression, resourceLocatorValueSchema, resourceMapperValueSchema, filterValueSchema, assignmentCollectionValueSchema, iDataObjectSchema, toolInstanceSchema, memoryInstanceSchema }) {

  // Static subnode schema
  const subnodesSchema = z.object({
    tools: z.array(toolInstanceSchema).optional(),
    memory: memoryInstanceSchema.optional(),
  }).strict();

  return z.object({
    parameters: z.object({
      resource: z.literal('audio'),
      operation: z.literal('generate').default('generate'),
      model: z.union([z.literal('tts-1'), z.literal('tts-1-hd'), expressionSchema]).optional(),
      input: stringOrExpression.optional(),
      voice: z.union([z.literal('alloy'), z.literal('echo'), z.literal('fable'), z.literal('nova'), z.literal('onyx'), z.literal('shimmer'), expressionSchema]).optional(),
      options: z.object({ response_format: z.union([z.literal('mp3'), z.literal('opus'), z.literal('aac'), z.literal('flac'), expressionSchema]).optional(), speed: numberOrExpression.optional(), binaryPropertyOutput: stringOrExpression.optional() }).optional(),
    }).optional(),
    subnodes: subnodesSchema.optional(),
  });
};