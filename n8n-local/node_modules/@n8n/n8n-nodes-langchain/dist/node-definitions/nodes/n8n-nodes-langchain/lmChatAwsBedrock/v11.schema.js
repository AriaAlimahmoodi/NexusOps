/**
 * AWS Bedrock Chat Model Node - Version 1.1 - Zod Validation Schemas
 *
 * These schemas validate node configuration at runtime.
 * Use .parse() for strict validation or .safeParse() for error handling.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

module.exports = function getSchema({ parameters, z, expressionSchema, stringOrExpression, numberOrExpression, booleanOrExpression, resourceLocatorValueSchema, resourceMapperValueSchema, filterValueSchema, assignmentCollectionValueSchema, iDataObjectSchema, resolveSchema, resolveOneOfSchemas }) {

  // Parameters schema
  const parametersSchema = z.object({
    authentication: z.union([z.literal('iam'), z.literal('assumeRole'), expressionSchema]).optional(),
    modelSource: z.union([z.literal('onDemand'), z.literal('inferenceProfile'), expressionSchema]).optional(),
    model: resolveOneOfSchemas({ parameters, variants: [{ schema: stringOrExpression, required: false, displayOptions: {"hide":{"modelSource":["inferenceProfile"]}}, defaults: {"modelSource":"onDemand"} }, { schema: stringOrExpression, required: false, displayOptions: {"show":{"modelSource":["inferenceProfile"]}}, defaults: {"modelSource":"onDemand"} }] }),
    options: z.object({ maxTokensToSample: numberOrExpression.optional(), temperature: numberOrExpression.optional(), topP: numberOrExpression.optional(), maxRetries: numberOrExpression.optional(), timeout: numberOrExpression.optional(), additionalModelRequestFields: z.union([iDataObjectSchema, z.string()]).optional(), latency: z.union([z.literal('standard'), z.literal('optimized'), expressionSchema]).optional(), guardrail: z.object({ values: z.object({ guardrailIdentifier: stringOrExpression.optional(), guardrailVersion: stringOrExpression.optional(), trace: z.union([z.literal('disabled'), z.literal('enabled'), z.literal('enabled_full'), expressionSchema]).optional() }).optional() }).optional() }).optional(),
  });

  // Return combined config schema
  return z.object({
    parameters: parametersSchema.nullable().optional(),
  });
};