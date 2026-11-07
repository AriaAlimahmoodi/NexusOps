/**
 * HubSpot Node - Version 2.2 - Zod Schema
 * Discriminator: resource=contactList, operation=remove
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
      resource: z.literal('contactList'),
      operation: z.literal('remove'),
      authentication: z.union([z.literal('apiKey'), z.literal('appToken'), z.literal('oAuth2'), expressionSchema]).optional(),
      id: numberOrExpression.optional(),
      listId: numberOrExpression.optional(),
    }).optional(),
  });
};