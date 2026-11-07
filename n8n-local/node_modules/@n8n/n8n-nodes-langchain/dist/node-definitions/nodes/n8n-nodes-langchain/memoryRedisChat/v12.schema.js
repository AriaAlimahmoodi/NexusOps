/**
 * Redis Chat Memory Node - Version 1.2 - Zod Validation Schemas
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
    sessionIdType: z.union([z.literal('fromInput'), z.literal('customKey'), expressionSchema]).optional(),
    sessionKey: resolveSchema({ parameters, schema: stringOrExpression, required: false, displayOptions: {"show":{"sessionIdType":["customKey"]}}, defaults: {"sessionIdType":"fromInput"} }),
    sessionTTL: numberOrExpression.optional(),
  });

  // Return combined config schema
  return z.object({
    parameters: parametersSchema.nullable().optional(),
  });
};