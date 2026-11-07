/**
 * QuickBooks Online Node - Version 1 - Zod Schema
 * Discriminator: resource=payment, operation=create
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
      resource: z.literal('payment'),
      operation: z.literal('create'),
      CustomerRef: stringOrExpression.optional(),
      TotalAmt: numberOrExpression.optional(),
      additionalFields: z.object({ TxnDate: stringOrExpression.optional() }).optional(),
    }).optional(),
  });
};