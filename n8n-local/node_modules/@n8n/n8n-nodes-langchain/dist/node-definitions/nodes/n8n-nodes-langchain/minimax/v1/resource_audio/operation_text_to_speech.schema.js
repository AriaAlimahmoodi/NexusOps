/**
 * MiniMax Node - Version 1 - Zod Schema
 * Discriminator: resource=audio, operation=textToSpeech
 *
 * Use .parse() for strict validation or .safeParse() for error handling.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

module.exports = function getSchema({ parameters, z, expressionSchema, stringOrExpression, numberOrExpression, booleanOrExpression, resourceLocatorValueSchema, resourceMapperValueSchema, filterValueSchema, assignmentCollectionValueSchema, iDataObjectSchema, toolInstanceSchema }) {

  // Static subnode schema
  const subnodesSchema = z.object({
    tools: z.array(toolInstanceSchema).optional(),
  }).strict();

  return z.object({
    parameters: z.object({
      resource: z.literal('audio'),
      operation: z.literal('textToSpeech').default('textToSpeech'),
      modelId: z.union([z.literal('speech-02-hd'), z.literal('speech-02-turbo'), z.literal('speech-2.6-hd'), z.literal('speech-2.6-turbo'), z.literal('speech-2.8-hd'), z.literal('speech-2.8-turbo'), expressionSchema]).optional(),
      text: stringOrExpression,
      voiceId: stringOrExpression.optional(),
      downloadAudio: booleanOrExpression.optional(),
      options: z.object({ audioFormat: z.union([z.literal('mp3'), z.literal('pcm'), z.literal('flac'), z.literal('wav'), expressionSchema]).optional(), emotion: z.union([z.literal('angry'), z.literal('calm'), z.literal('disgusted'), z.literal('fearful'), z.literal('happy'), z.literal('sad'), z.literal('surprised'), expressionSchema]).optional(), languageBoost: z.union([z.literal('Arabic'), z.literal('auto'), z.literal('Chinese'), z.literal('English'), z.literal('French'), z.literal('German'), z.literal('Indonesian'), z.literal('Italian'), z.literal('Japanese'), z.literal('Korean'), z.literal('Portuguese'), z.literal('Russian'), z.literal('Spanish'), z.literal('Thai'), z.literal('Turkish'), z.literal('Vietnamese'), expressionSchema]).optional(), pitch: numberOrExpression.optional(), speed: numberOrExpression.optional(), volume: numberOrExpression.optional() }).optional(),
    }).optional(),
    subnodes: subnodesSchema.optional(),
  });
};