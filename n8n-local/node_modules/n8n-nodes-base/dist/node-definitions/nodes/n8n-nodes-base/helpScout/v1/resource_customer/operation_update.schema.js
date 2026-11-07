/**
 * Help Scout Node - Version 1 - Zod Schema
 * Discriminator: resource=customer, operation=update
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
      resource: z.literal('customer'),
      operation: z.literal('update'),
      customerId: stringOrExpression.optional(),
      updateFields: z.object({ age: numberOrExpression.optional(), firstName: stringOrExpression.optional(), gender: z.union([z.literal('female'), z.literal('male'), z.literal('unknown'), expressionSchema]).optional(), jobTitle: stringOrExpression.optional(), lastName: stringOrExpression.optional(), location: stringOrExpression.optional(), background: stringOrExpression.optional(), organization: stringOrExpression.optional(), photoUrl: stringOrExpression.optional() }).optional(),
    }).optional(),
  });
};