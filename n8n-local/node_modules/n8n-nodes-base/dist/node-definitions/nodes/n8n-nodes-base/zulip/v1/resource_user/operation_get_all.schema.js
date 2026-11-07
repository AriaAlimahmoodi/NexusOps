/**
 * Zulip Node - Version 1 - Zod Schema
 * Discriminator: resource=user, operation=getAll
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
      resource: z.literal('user'),
      operation: z.literal('getAll'),
      additionalFields: z.object({ clientGravatar: booleanOrExpression.optional(), includeCustomProfileFields: booleanOrExpression.optional() }).optional(),
    }).optional(),
  });
};