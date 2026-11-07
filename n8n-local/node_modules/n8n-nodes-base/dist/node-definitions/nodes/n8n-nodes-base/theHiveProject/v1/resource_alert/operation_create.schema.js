/**
 * TheHive 5 Node - Version 1 - Zod Schema
 * Discriminator: resource=alert, operation=create
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
      resource: z.literal('alert').default('alert'),
      operation: z.literal('create').default('create'),
      alertFields: resourceMapperValueSchema.optional(),
      observableUi: z.object({ values: z.array(z.object({ dataType: stringOrExpression.optional(), data: stringOrExpression.optional(), binaryProperty: stringOrExpression.optional(), message: stringOrExpression.optional(), tags: stringOrExpression.optional() })).optional() }).optional(),
    }).optional(),
  });
};