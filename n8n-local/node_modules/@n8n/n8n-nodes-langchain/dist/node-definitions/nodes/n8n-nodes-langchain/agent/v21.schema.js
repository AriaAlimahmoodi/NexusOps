/**
 * AI Agent Node - Version 2.1 - Zod Validation Schemas
 *
 * These schemas validate node configuration at runtime.
 * Use .parse() for strict validation or .safeParse() for error handling.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

module.exports = function getSchema({ parameters, z, expressionSchema, stringOrExpression, numberOrExpression, booleanOrExpression, resourceLocatorValueSchema, resourceMapperValueSchema, filterValueSchema, assignmentCollectionValueSchema, iDataObjectSchema, resolveSchema, resolveOneOfSchemas, languageModelInstanceSchema, memoryInstanceSchema, toolInstanceSchema, outputParserInstanceSchema }) {

  // Helper function for conditional subnode schema
  function getSubnodesSchema() {
    return z.object({
      model: z.union([languageModelInstanceSchema, z.array(languageModelInstanceSchema)]),
      memory: memoryInstanceSchema.optional(),
      tools: z.array(toolInstanceSchema).optional(),
      outputParser: resolveSchema({ parameters, schema: outputParserInstanceSchema, required: false, displayOptions: {"show":{"hasOutputParser":[true]}}, defaults: {"hasOutputParser":false} }),
    }).strict();
  }

  // Parameters schema
  const parametersSchema = z.object({
    promptType: z.union([z.literal('auto'), z.literal('guardrails'), z.literal('define'), expressionSchema]).optional(),
    text: resolveSchema({ parameters, schema: stringOrExpression, required: true, displayOptions: {"show":{"promptType":["define"]}}, defaults: {"promptType":"auto"} }),
    hasOutputParser: z.boolean().optional(),
    needsFallback: z.boolean().optional(),
    options: z.object({ systemMessage: stringOrExpression.optional(), maxIterations: numberOrExpression.optional(), returnIntermediateSteps: booleanOrExpression.optional(), passthroughBinaryImages: booleanOrExpression.optional(), passthroughBinaryPdfs: booleanOrExpression.optional(), tracingMetadata: z.object({ values: z.array(z.object({ key: stringOrExpression.optional(), type: z.union([z.literal('arrayValue'), z.literal('booleanValue'), z.literal('numberValue'), z.literal('objectValue'), z.literal('stringValue'), expressionSchema]).optional(), stringValue: stringOrExpression.optional(), numberValue: stringOrExpression.optional(), booleanValue: z.union([z.literal('true'), z.literal('false'), expressionSchema]).optional(), arrayValue: stringOrExpression.optional(), objectValue: z.union([iDataObjectSchema, z.string()]).optional() })).optional() }).optional(), batching: z.object({ batchSize: numberOrExpression.optional(), delayBetweenBatches: numberOrExpression.optional() }).optional() }).optional(),
  });

  // Return combined config schema
  return z.object({
    parameters: parametersSchema.nullable().optional(),
    subnodes: getSubnodesSchema(),
  });
};