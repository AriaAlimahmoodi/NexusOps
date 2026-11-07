/**
 * Mautic Node - Version 1 - Zod Schema
 * Discriminator: resource=contact, operation=get
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
      resource: z.literal('contact').default('contact'),
      operation: z.literal('get'),
      authentication: z.union([z.literal('credentials'), z.literal('oAuth2'), expressionSchema]).optional(),
      contactId: stringOrExpression.optional(),
      options: z.object({ search: stringOrExpression.optional(), orderBy: stringOrExpression.optional(), orderByDir: z.union([z.literal('asc'), z.literal('desc'), expressionSchema]).optional(), publishedOnly: booleanOrExpression.optional(), minimal: booleanOrExpression.optional(), rawData: booleanOrExpression.optional() }).optional(),
    }).optional(),
  });
};