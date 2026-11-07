/**
 * MongoDB Atlas Vector Store Node - Version 1.3 - Zod Schema
 * Discriminator: mode=load
 *
 * Use .parse() for strict validation or .safeParse() for error handling.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

module.exports = function getSchema({ parameters, z, expressionSchema, stringOrExpression, numberOrExpression, booleanOrExpression, resourceLocatorValueSchema, resourceMapperValueSchema, filterValueSchema, assignmentCollectionValueSchema, iDataObjectSchema, resolveSchema, resolveOneOfSchemas, embeddingInstanceSchema, rerankerInstanceSchema }) {

  // Helper function for conditional subnode schema
  function getSubnodesSchema() {
    return z.object({
      embedding: z.union([embeddingInstanceSchema, z.array(embeddingInstanceSchema)]),
      reranker: resolveSchema({ parameters, schema: rerankerInstanceSchema, required: true, displayOptions: {"show":{"useReranker":[true]}}, defaults: {"useReranker":false} }),
    }).strict();
  }

  return z.object({
    parameters: z.object({
      mode: z.literal('load'),
      mongoCollection: z.union([z.object({ __rl: z.literal(true), mode: z.union([z.literal('list'), z.literal('name')]), value: z.union([z.string(), z.number()]), cachedResultName: z.string().optional(), cachedResultUrl: z.string().optional() }), expressionSchema]).optional(),
      embedding: stringOrExpression.optional(),
      metadata_field: stringOrExpression.optional(),
      vectorIndexName: stringOrExpression,
      prompt: stringOrExpression,
      topK: numberOrExpression.optional(),
      includeDocumentMetadata: booleanOrExpression.optional(),
      useReranker: booleanOrExpression.optional(),
      options: z.object({ namespace: stringOrExpression.optional(), metadata: z.object({ metadataValues: z.array(z.object({ name: stringOrExpression.optional(), value: stringOrExpression.optional() })).optional() }).optional(), preFilter: z.union([iDataObjectSchema, z.string()]).optional(), postFilterPipeline: z.union([iDataObjectSchema, z.string()]).optional() }).optional(),
    }).optional(),
    subnodes: getSubnodesSchema(),
  });
};