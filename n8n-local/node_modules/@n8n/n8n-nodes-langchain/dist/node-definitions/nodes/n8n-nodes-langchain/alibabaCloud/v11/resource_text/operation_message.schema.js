/**
 * Qwen Cloud Node - Version 1.1 - Zod Schema
 * Discriminator: resource=text, operation=message
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
      resource: z.literal('text').default('text'),
      operation: z.literal('message').default('message'),
      modelId: z.union([z.object({ __rl: z.literal(true), mode: z.union([z.literal('list'), z.literal('id')]), value: z.union([z.string(), z.number()]), cachedResultName: z.string().optional(), cachedResultUrl: z.string().optional() }), expressionSchema]).optional(),
      messages: z.object({ messageValues: z.array(z.object({ content: stringOrExpression.optional(), role: z.union([z.literal('user'), z.literal('assistant'), expressionSchema]).optional() })).optional() }).optional(),
      simplify: booleanOrExpression.optional(),
      options: z.object({ enableSearch: booleanOrExpression.optional(), maxTokens: numberOrExpression.optional(), maxToolsIterations: numberOrExpression.optional(), repetitionPenalty: numberOrExpression.optional(), seed: numberOrExpression.optional(), stop: stringOrExpression.optional(), system: stringOrExpression.optional(), temperature: numberOrExpression.optional(), topK: numberOrExpression.optional(), topP: numberOrExpression.optional() }).optional(),
    }).optional(),
    subnodes: subnodesSchema.optional(),
  });
};