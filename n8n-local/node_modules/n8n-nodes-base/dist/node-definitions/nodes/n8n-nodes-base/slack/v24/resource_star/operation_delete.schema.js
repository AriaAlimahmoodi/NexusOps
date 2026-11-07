/**
 * Slack Node - Version 2.4 - Zod Schema
 * Discriminator: resource=star, operation=delete
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
      resource: z.literal('star'),
      operation: z.literal('delete'),
      authentication: z.union([z.literal('accessToken'), z.literal('oAuth2'), expressionSchema]).optional(),
      options: z.object({ channelId: stringOrExpression.optional(), fileId: stringOrExpression.optional(), fileComment: stringOrExpression.optional(), timestamp: numberOrExpression.optional() }).optional(),
    }).optional(),
  });
};