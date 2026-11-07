/**
 * Wise Node - Version 1 - Zod Schema
 * Discriminator: resource=quote, operation=create
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
      resource: z.literal('quote'),
      operation: z.literal('create'),
      profileId: stringOrExpression.optional(),
      targetAccountId: stringOrExpression.optional(),
      amountType: z.union([z.literal('source'), z.literal('target'), expressionSchema]).optional(),
      amount: numberOrExpression.optional(),
      sourceCurrency: stringOrExpression.optional(),
      targetCurrency: stringOrExpression.optional(),
    }).optional(),
  });
};