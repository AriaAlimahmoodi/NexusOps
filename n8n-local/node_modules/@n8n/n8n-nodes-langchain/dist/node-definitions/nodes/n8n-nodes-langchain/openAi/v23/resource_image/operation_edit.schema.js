/**
 * OpenAI Node - Version 2.3 - Zod Schema
 * Discriminator: resource=image, operation=edit
 *
 * Use .parse() for strict validation or .safeParse() for error handling.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

module.exports = function getSchema({ parameters, z, expressionSchema, stringOrExpression, numberOrExpression, booleanOrExpression, resourceLocatorValueSchema, resourceMapperValueSchema, filterValueSchema, assignmentCollectionValueSchema, iDataObjectSchema, resolveSchema, resolveOneOfSchemas, toolInstanceSchema, memoryInstanceSchema }) {

  // Static subnode schema
  const subnodesSchema = z.object({
    tools: z.array(toolInstanceSchema).optional(),
    memory: memoryInstanceSchema.optional(),
  }).strict();

  return z.object({
    parameters: z.object({
      resource: z.literal('image'),
      operation: z.literal('edit'),
      modelId: z.union([z.object({ __rl: z.literal(true), mode: z.union([z.literal('list'), z.literal('id')]), value: z.union([z.string(), z.number()]), cachedResultName: z.string().optional(), cachedResultUrl: z.string().optional() }), expressionSchema]).optional(),
      prompt: stringOrExpression,
      images: resolveOneOfSchemas({ parameters, variants: [{ schema: z.object({ values: z.array(z.object({ binaryPropertyName: stringOrExpression.optional() })).optional() }), required: false, displayOptions: {"show":{"/model":["gpt-image-1"]}} }, { schema: z.object({ values: z.array(z.object({ binaryPropertyName: stringOrExpression.optional() })).optional() }), required: false, displayOptions: {"show":{"/modelId":[{"_cnd":{"includes":"gpt-image"}}]}} }] }),
      binaryPropertyName: resolveOneOfSchemas({ parameters, variants: [{ schema: stringOrExpression, required: false, displayOptions: {"show":{"/model":["dall-e-2"]}} }, { schema: stringOrExpression, required: false, displayOptions: {"show":{"/modelId":[{"_cnd":{"includes":"dall-e"}}]}} }] }),
      n: numberOrExpression.optional(),
      size: z.union([z.literal('256x256'), z.literal('512x512'), z.literal('1024x1024'), z.literal('1024x1536'), z.literal('1536x1024'), z.literal('auto'), expressionSchema]).optional(),
      quality: resolveOneOfSchemas({ parameters, variants: [{ schema: z.union([z.literal('auto'), z.literal('high'), z.literal('medium'), z.literal('low'), z.literal('standard'), expressionSchema]), required: false, displayOptions: {"show":{"/model":["gpt-image-1"]}} }, { schema: z.union([z.literal('auto'), z.literal('high'), z.literal('medium'), z.literal('low'), z.literal('standard'), expressionSchema]), required: false, displayOptions: {"show":{"/modelId":[{"_cnd":{"includes":"gpt-image"}}]}} }] }),
      responseFormat: resolveOneOfSchemas({ parameters, variants: [{ schema: z.union([z.literal('url'), z.literal('b64_json'), expressionSchema]), required: false, displayOptions: {"show":{"/model":["dall-e-2"]}} }, { schema: z.union([z.literal('url'), z.literal('b64_json'), expressionSchema]), required: false, displayOptions: {"show":{"/modelId":[{"_cnd":{"includes":"dall-e"}}]}} }] }),
      outputFormat: resolveOneOfSchemas({ parameters, variants: [{ schema: z.union([z.literal('png'), z.literal('jpeg'), z.literal('webp'), expressionSchema]), required: false, displayOptions: {"show":{"/model":["gpt-image-1"]}} }, { schema: z.union([z.literal('png'), z.literal('jpeg'), z.literal('webp'), expressionSchema]), required: false, displayOptions: {"show":{"/modelId":[{"_cnd":{"includes":"gpt-image"}}]}} }] }),
      outputCompression: resolveOneOfSchemas({ parameters, variants: [{ schema: numberOrExpression, required: false, displayOptions: {"show":{"/model":["gpt-image-1"],"outputFormat":["webp","jpeg"]}}, defaults: {"outputFormat":"png"} }, { schema: numberOrExpression, required: false, displayOptions: {"show":{"/modelId":[{"_cnd":{"includes":"gpt-image"}}],"outputFormat":["webp","jpeg"]}}, defaults: {"outputFormat":"png"} }] }),
      options: z.object({ user: stringOrExpression.optional(), background: z.union([z.literal('auto'), z.literal('transparent'), z.literal('opaque'), expressionSchema]).optional(), inputFidelity: z.union([z.literal('low'), z.literal('high'), expressionSchema]).optional(), imageMask: stringOrExpression.optional() }).optional(),
    }).optional(),
    subnodes: subnodesSchema.optional(),
  });
};