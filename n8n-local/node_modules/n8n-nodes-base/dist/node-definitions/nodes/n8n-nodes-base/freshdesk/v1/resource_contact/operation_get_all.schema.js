/**
 * Freshdesk Node - Version 1 - Zod Schema
 * Discriminator: resource=contact, operation=getAll
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
      resource: z.literal('contact'),
      operation: z.literal('getAll'),
      filters: z.object({ company_id: numberOrExpression.optional(), email: stringOrExpression.optional(), mobile: stringOrExpression.optional(), phone: stringOrExpression.optional(), state: z.union([z.literal('blocked'), z.literal('deleted'), z.literal('unverified'), z.literal('verified'), expressionSchema]).optional(), updated_since: stringOrExpression.optional() }).optional(),
    }).optional(),
  });
};