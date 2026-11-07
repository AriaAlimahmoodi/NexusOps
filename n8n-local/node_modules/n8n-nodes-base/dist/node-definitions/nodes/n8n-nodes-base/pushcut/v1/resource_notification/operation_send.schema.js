/**
 * Pushcut Node - Version 1 - Zod Schema
 * Discriminator: resource=notification, operation=send
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
      resource: z.literal('notification').default('notification'),
      operation: z.literal('send').default('send'),
      notificationName: stringOrExpression.optional(),
      additionalFields: z.object({ devices: z.array(z.string()).optional(), input: stringOrExpression.optional(), text: stringOrExpression.optional(), title: stringOrExpression.optional() }).optional(),
    }).optional(),
  });
};