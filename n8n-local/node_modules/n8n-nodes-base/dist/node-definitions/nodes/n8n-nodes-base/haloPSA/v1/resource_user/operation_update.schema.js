/**
 * HaloPSA Node - Version 1 - Zod Schema
 * Discriminator: resource=user, operation=update
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
      operation: z.literal('update'),
      userId: stringOrExpression.optional(),
      updateFields: z.object({ emailaddress: stringOrExpression.optional(), name: stringOrExpression.optional(), notes: stringOrExpression.optional(), password: stringOrExpression.optional(), site_id: stringOrExpression.optional(), surname: stringOrExpression.optional(), inactive: booleanOrExpression.optional() }).optional(),
    }).optional(),
  });
};