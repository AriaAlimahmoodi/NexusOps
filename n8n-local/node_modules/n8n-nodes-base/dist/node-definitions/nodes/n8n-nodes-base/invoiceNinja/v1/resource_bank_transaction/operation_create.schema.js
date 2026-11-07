/**
 * Invoice Ninja Node - Version 1 - Zod Schema
 * Discriminator: resource=bank_transaction, operation=create
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
      resource: z.literal('bank_transaction'),
      operation: z.literal('create').default('create'),
      apiVersion: z.union([z.literal('v4'), z.literal('v5'), expressionSchema]).optional(),
      additionalFields: z.object({ amount: numberOrExpression.optional(), bankIntegrationId: stringOrExpression.optional(), baseType: z.union([z.literal('CREDIT'), z.literal('DEBIT'), expressionSchema]).optional(), currencyId: stringOrExpression.optional(), date: stringOrExpression.optional(), description: stringOrExpression.optional() }).optional(),
    }).optional(),
  });
};