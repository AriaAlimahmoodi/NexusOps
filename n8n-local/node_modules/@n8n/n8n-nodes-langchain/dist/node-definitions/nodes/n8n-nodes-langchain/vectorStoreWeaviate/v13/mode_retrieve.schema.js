/**
 * Weaviate Vector Store Node - Version 1.3 - Zod Schema
 * Discriminator: mode=retrieve
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
      mode: z.literal('retrieve').default('retrieve'),
      weaviateCollection: z.union([z.object({ __rl: z.literal(true), mode: z.union([z.literal('list'), z.literal('id')]), value: z.union([z.string(), z.number()]), cachedResultName: z.string().optional(), cachedResultUrl: z.string().optional() }), expressionSchema]).optional(),
      useReranker: booleanOrExpression.optional(),
      options: z.object({ searchFilterJson: z.union([iDataObjectSchema, z.string()]).optional(), metadataKeys: stringOrExpression.optional(), hybridQuery: stringOrExpression.optional(), hybridExplainScore: booleanOrExpression.optional(), fusionType: z.union([z.literal('RelativeScore'), z.literal('Ranked'), expressionSchema]).optional(), autoCutLimit: numberOrExpression.optional(), alpha: numberOrExpression.optional(), queryProperties: stringOrExpression.optional(), maxVectorDistance: numberOrExpression.optional(), tenant: stringOrExpression.optional(), textKey: stringOrExpression.optional(), skip_init_checks: booleanOrExpression.optional(), timeout_init: numberOrExpression.optional(), timeout_insert: numberOrExpression.optional(), timeout_query: numberOrExpression.optional(), proxy_grpc: stringOrExpression.optional() }).optional(),
    }).optional(),
    subnodes: getSubnodesSchema(),
  });
};