/**
 * Azure AI Search Vector Store Node - Version 1.3 - Zod Schema
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
      indexName: stringOrExpression.optional(),
      prompt: stringOrExpression,
      topK: numberOrExpression.optional(),
      includeDocumentMetadata: booleanOrExpression.optional(),
      useReranker: booleanOrExpression.optional(),
      options: z.object({ queryType: z.union([z.literal('vector'), z.literal('hybrid'), z.literal('semanticHybrid'), expressionSchema]).optional(), filter: stringOrExpression.optional(), semanticConfiguration: stringOrExpression.optional() }).optional(),
    }).optional(),
    subnodes: getSubnodesSchema(),
  });
};