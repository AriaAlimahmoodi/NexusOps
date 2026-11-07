/**
 * Google Gemini Chat Model Node - Version 1.1 - Zod Validation Schemas
 *
 * These schemas validate node configuration at runtime.
 * Use .parse() for strict validation or .safeParse() for error handling.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

module.exports = function getSchema({ parameters, z, expressionSchema, stringOrExpression, numberOrExpression, booleanOrExpression, resourceLocatorValueSchema, resourceMapperValueSchema, filterValueSchema, assignmentCollectionValueSchema, iDataObjectSchema }) {

  // Parameters schema
  const parametersSchema = z.object({
    modelName: stringOrExpression.optional(),
    options: z.object({ maxOutputTokens: numberOrExpression.optional(), temperature: numberOrExpression.optional(), topK: numberOrExpression.optional(), topP: numberOrExpression.optional(), safetySettings: z.object({ values: z.array(z.object({ category: z.union([z.literal('HARM_CATEGORY_HARASSMENT'), z.literal('HARM_CATEGORY_HATE_SPEECH'), z.literal('HARM_CATEGORY_SEXUALLY_EXPLICIT'), z.literal('HARM_CATEGORY_DANGEROUS_CONTENT'), expressionSchema]).optional(), threshold: z.union([z.literal('HARM_BLOCK_THRESHOLD_UNSPECIFIED'), z.literal('BLOCK_LOW_AND_ABOVE'), z.literal('BLOCK_MEDIUM_AND_ABOVE'), z.literal('BLOCK_ONLY_HIGH'), z.literal('BLOCK_NONE'), expressionSchema]).optional() })).optional() }).optional() }).optional(),
  });

  // Return combined config schema
  return z.object({
    parameters: parametersSchema.nullable().optional(),
  });
};