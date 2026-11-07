/**
 * urlscan.io Node - Version 1 - Zod Schema
 * Discriminator: resource=scan, operation=perform
 *
 * Use .parse() for strict validation or .safeParse() for error handling.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

module.exports = function getSchema({ parameters, z, expressionSchema, stringOrExpression, numberOrExpression, booleanOrExpression, resourceLocatorValueSchema, resourceMapperValueSchema, filterValueSchema, assignmentCollectionValueSchema, iDataObjectSchema }) {

  return z.object({
    parameters: z.object({
      resource: z.literal('scan').default('scan'),
      operation: z.literal('perform').default('perform'),
      url: stringOrExpression.optional(),
      additionalFields: z.object({ customAgent: stringOrExpression.optional(), overrideSafety: stringOrExpression.optional(), referer: stringOrExpression.optional(), tags: stringOrExpression.optional(), visibility: z.union([z.literal('private'), z.literal('public'), z.literal('unlisted'), expressionSchema]).optional() }).optional(),
    }).optional(),
  });
};