/**
 * Ollama Node - Version 1 - Zod Schema
 * Discriminator: resource=image, operation=analyze
 *
 * Use .parse() for strict validation or .safeParse() for error handling.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

module.exports = function getSchema({ parameters, z, expressionSchema, stringOrExpression, numberOrExpression, booleanOrExpression, resourceLocatorValueSchema, resourceMapperValueSchema, filterValueSchema, assignmentCollectionValueSchema, iDataObjectSchema, resolveSchema, resolveOneOfSchemas, toolInstanceSchema }) {

  // Static subnode schema
  const subnodesSchema = z.object({
    tools: z.array(toolInstanceSchema).optional(),
  }).strict();

  return z.object({
    parameters: z.object({
      resource: z.literal('image'),
      operation: z.literal('analyze').default('analyze'),
      modelId: z.union([z.object({ __rl: z.literal(true), mode: z.union([z.literal('list'), z.literal('id')]), value: z.union([z.string(), z.number()]), cachedResultName: z.string().optional(), cachedResultUrl: z.string().optional() }), expressionSchema]).optional(),
      text: stringOrExpression.optional(),
      inputType: z.union([z.literal('binary'), z.literal('url'), expressionSchema]).optional(),
      binaryPropertyName: resolveSchema({ parameters, schema: stringOrExpression, required: false, displayOptions: {"show":{"inputType":["binary"]}}, defaults: {"inputType":"binary"} }),
      imageUrls: resolveSchema({ parameters, schema: stringOrExpression, required: false, displayOptions: {"show":{"inputType":["url"]}}, defaults: {"inputType":"binary"} }),
      simplify: booleanOrExpression.optional(),
      options: z.object({ system: stringOrExpression.optional(), temperature: numberOrExpression.optional(), think: booleanOrExpression.optional(), top_p: numberOrExpression.optional(), top_k: numberOrExpression.optional(), num_predict: numberOrExpression.optional(), frequency_penalty: numberOrExpression.optional(), presence_penalty: numberOrExpression.optional(), repeat_penalty: numberOrExpression.optional(), num_ctx: numberOrExpression.optional(), repeat_last_n: numberOrExpression.optional(), min_p: numberOrExpression.optional(), seed: numberOrExpression.optional(), stop: stringOrExpression.optional(), keep_alive: stringOrExpression.optional(), low_vram: booleanOrExpression.optional(), main_gpu: numberOrExpression.optional(), num_batch: numberOrExpression.optional(), num_gpu: numberOrExpression.optional(), num_thread: numberOrExpression.optional(), penalize_newline: booleanOrExpression.optional(), use_mlock: booleanOrExpression.optional(), use_mmap: booleanOrExpression.optional(), vocab_only: booleanOrExpression.optional(), format: z.union([z.literal(''), z.literal('json'), expressionSchema]).optional() }).optional(),
    }).optional(),
    subnodes: subnodesSchema.optional(),
  });
};