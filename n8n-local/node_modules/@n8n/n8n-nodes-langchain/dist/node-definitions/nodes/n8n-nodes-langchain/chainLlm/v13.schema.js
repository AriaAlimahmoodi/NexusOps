/**
 * Basic LLM Chain Node - Version 1.3 - Zod Validation Schemas
 *
 * These schemas validate node configuration at runtime.
 * Use .parse() for strict validation or .safeParse() for error handling.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

module.exports = function getSchema({ parameters, z, expressionSchema, stringOrExpression, numberOrExpression, booleanOrExpression, resourceLocatorValueSchema, resourceMapperValueSchema, filterValueSchema, assignmentCollectionValueSchema, iDataObjectSchema, resolveSchema, resolveOneOfSchemas, languageModelInstanceSchema, outputParserInstanceSchema }) {

  // Helper function for conditional subnode schema
  function getSubnodesSchema() {
    return z.object({
      model: z.union([languageModelInstanceSchema, z.array(languageModelInstanceSchema)]),
      outputParser: resolveSchema({ parameters, schema: outputParserInstanceSchema, required: false, displayOptions: {"show":{"hasOutputParser":[true]}} }),
    }).strict();
  }

  // Parameters schema
  const parametersSchema = z.object({
    prompt: stringOrExpression.optional(),
    text: resolveSchema({ parameters, schema: stringOrExpression, required: true, displayOptions: {"show":{"promptType":["define"]}} }),
    messages: z.object({ messageValues: z.array(z.object({ type: z.union([z.literal('AIMessagePromptTemplate'), z.literal('SystemMessagePromptTemplate'), z.literal('HumanMessagePromptTemplate'), expressionSchema]).optional(), messageType: z.union([z.literal('text'), z.literal('imageBinary'), z.literal('imageUrl'), expressionSchema]).optional(), binaryImageDataKey: stringOrExpression.optional(), imageUrl: stringOrExpression.optional(), imageDetail: z.union([z.literal('auto'), z.literal('low'), z.literal('high'), expressionSchema]).optional(), message: stringOrExpression.optional() })).optional() }).optional(),
  });

  // Return combined config schema
  return z.object({
    parameters: parametersSchema.nullable().optional(),
    subnodes: getSubnodesSchema(),
  });
};