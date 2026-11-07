/**
 * SyncroMSP Node - Version 1 - Zod Schema
 * Discriminator: resource=rmm, operation=create
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
      resource: z.literal('rmm'),
      operation: z.literal('create'),
      assetId: stringOrExpression.optional(),
      customerId: stringOrExpression.optional(),
      description: stringOrExpression.optional(),
      additionalFields: z.object({ resolved: booleanOrExpression.optional() }).optional(),
    }).optional(),
  });
};