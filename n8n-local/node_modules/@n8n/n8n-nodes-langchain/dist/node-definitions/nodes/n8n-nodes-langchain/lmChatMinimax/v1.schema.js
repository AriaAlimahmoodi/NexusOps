/**
 * MiniMax Chat Model Node - Version 1 - Zod Validation Schemas
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
    model: z.union([z.literal('MiniMax-M2'), z.literal('MiniMax-M2.1'), z.literal('MiniMax-M2.1-highspeed'), z.literal('MiniMax-M2.5'), z.literal('MiniMax-M2.5-highspeed'), z.literal('MiniMax-M2.7'), z.literal('MiniMax-M2.7-highspeed'), expressionSchema]).optional(),
    options: z.object({ hideThinking: booleanOrExpression.optional(), maxTokens: numberOrExpression.optional(), temperature: numberOrExpression.optional(), timeout: numberOrExpression.optional(), maxRetries: numberOrExpression.optional(), topP: numberOrExpression.optional() }).optional(),
  });

  // Return combined config schema
  return z.object({
    parameters: parametersSchema.nullable().optional(),
  });
};