/**
 * Lemlist Node - Version 2 - Zod Schema
 * Discriminator: resource=lead, operation=unsubscribe
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
      resource: z.literal('lead'),
      operation: z.literal('unsubscribe'),
      campaignId: stringOrExpression.optional(),
      email: stringOrExpression.optional(),
    }).optional(),
  });
};