/**
 * Invoice Ninja Node - Version 2 - Zod Schema
 * Discriminator: resource=invoice, operation=create
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
      resource: z.literal('invoice'),
      operation: z.literal('create').default('create'),
      apiVersion: z.union([z.literal('v4'), z.literal('v5'), expressionSchema]).optional(),
      additionalFields: z.object({ client: stringOrExpression.optional(), autoBill: booleanOrExpression.optional(), customValue1: numberOrExpression.optional(), customValue2: numberOrExpression.optional(), discount: stringOrExpression.optional(), dueDate: stringOrExpression.optional(), email: stringOrExpression.optional(), emailInvoice: booleanOrExpression.optional(), invoiceDate: stringOrExpression.optional(), invoiceNumber: stringOrExpression.optional(), invoiceStatus: z.union([z.literal(1), z.literal(2), expressionSchema]).optional(), isAmountDiscount: booleanOrExpression.optional(), markSent: booleanOrExpression.optional(), paid: numberOrExpression.optional(), partial: numberOrExpression.optional(), partialDueDate: stringOrExpression.optional(), poNumber: stringOrExpression.optional(), privateNotes: stringOrExpression.optional(), publicNotes: stringOrExpression.optional(), taxName1: stringOrExpression.optional(), taxName2: stringOrExpression.optional(), taxRate1: numberOrExpression.optional(), taxRate2: numberOrExpression.optional() }).optional(),
      invoiceItemsUi: z.object({ invoiceItemsValues: z.array(z.object({ cost: numberOrExpression.optional(), description: stringOrExpression.optional(), service: stringOrExpression.optional(), hours: numberOrExpression.optional(), taxName1: stringOrExpression.optional(), taxName2: stringOrExpression.optional(), taxRate1: numberOrExpression.optional(), taxRate2: numberOrExpression.optional() })).optional() }).optional(),
    }).optional(),
  });
};