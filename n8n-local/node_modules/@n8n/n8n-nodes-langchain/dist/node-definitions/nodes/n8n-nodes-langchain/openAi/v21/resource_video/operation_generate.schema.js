/**
 * OpenAI Node - Version 2.1 - Zod Schema
 * Discriminator: resource=video, operation=generate
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
      resource: z.literal('video'),
      operation: z.literal('generate').default('generate'),
      modelId: z.union([z.object({ __rl: z.literal(true), mode: z.union([z.literal('list'), z.literal('id')]), value: z.union([z.string(), z.number()]), cachedResultName: z.string().optional(), cachedResultUrl: z.string().optional() }), expressionSchema]).optional(),
      prompt: stringOrExpression.optional(),
      seconds: numberOrExpression.optional(),
      size: z.union([z.literal('720x1280'), z.literal('1280x720'), z.literal('1024x1792'), z.literal('1792x1024'), expressionSchema]).optional(),
      options: z.object({ binaryPropertyNameReference: stringOrExpression.optional(), waitTime: numberOrExpression.optional(), fileName: stringOrExpression.optional() }).optional(),
    }).optional(),
    subnodes: subnodesSchema.optional(),
  });
};