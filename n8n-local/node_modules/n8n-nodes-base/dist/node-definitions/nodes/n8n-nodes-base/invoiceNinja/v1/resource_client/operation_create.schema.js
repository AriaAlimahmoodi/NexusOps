/**
 * Invoice Ninja Node - Version 1 - Zod Schema
 * Discriminator: resource=client, operation=create
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
      resource: z.literal('client').default('client'),
      operation: z.literal('create').default('create'),
      apiVersion: z.union([z.literal('v4'), z.literal('v5'), expressionSchema]).optional(),
      additionalFields: z.object({ clientName: stringOrExpression.optional(), idNumber: stringOrExpression.optional(), privateNotes: stringOrExpression.optional(), vatNumber: stringOrExpression.optional(), workPhone: stringOrExpression.optional(), website: stringOrExpression.optional() }).optional(),
      billingAddressUi: z.object({ billingAddressValue: z.object({ streetAddress: stringOrExpression.optional(), aptSuite: stringOrExpression.optional(), city: stringOrExpression.optional(), state: stringOrExpression.optional(), postalCode: stringOrExpression.optional(), countryCode: stringOrExpression.optional() }).optional() }).optional(),
      contactsUi: z.object({ contacstValues: z.array(z.object({ firstName: stringOrExpression.optional(), lastName: stringOrExpression.optional(), email: stringOrExpression.optional(), phone: stringOrExpression.optional() })).optional() }).optional(),
      shippingAddressUi: z.object({ shippingAddressValue: z.object({ streetAddress: stringOrExpression.optional(), aptSuite: stringOrExpression.optional(), city: stringOrExpression.optional(), state: stringOrExpression.optional(), postalCode: stringOrExpression.optional(), countryCode: stringOrExpression.optional() }).optional() }).optional(),
    }).optional(),
  });
};