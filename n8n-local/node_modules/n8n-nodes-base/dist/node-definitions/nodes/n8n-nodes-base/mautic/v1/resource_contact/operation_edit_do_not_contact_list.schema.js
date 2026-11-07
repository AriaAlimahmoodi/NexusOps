/**
 * Mautic Node - Version 1 - Zod Schema
 * Discriminator: resource=contact, operation=editDoNotContactList
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
      operation: z.literal('editDoNotContactList'),
      authentication: z.union([z.literal('credentials'), z.literal('oAuth2'), expressionSchema]).optional(),
      contactId: stringOrExpression.optional(),
      action: z.union([z.literal('add'), z.literal('remove'), expressionSchema]).optional(),
      channel: z.union([z.literal('email'), z.literal('sms'), expressionSchema]).optional(),
      additionalFields: z.object({ reason: z.union([z.literal('1'), z.literal('2'), z.literal('3'), expressionSchema]).optional(), comments: stringOrExpression.optional() }).optional(),
      options: z.object({ search: stringOrExpression.optional(), orderBy: stringOrExpression.optional(), orderByDir: z.union([z.literal('asc'), z.literal('desc'), expressionSchema]).optional(), publishedOnly: booleanOrExpression.optional(), minimal: booleanOrExpression.optional(), rawData: booleanOrExpression.optional() }).optional(),
    }).optional(),
  });
};