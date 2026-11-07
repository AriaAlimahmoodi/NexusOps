/**
 * Odoo Node - Version 1 - Zod Schema
 * Discriminator: resource=custom, operation=create
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
      resource: z.literal('custom'),
      operation: z.literal('create').default('create'),
      customResource: stringOrExpression.optional(),
      fieldsToCreateOrUpdate: z.object({ fields: z.array(z.object({ fieldName: stringOrExpression.optional(), fieldValue: stringOrExpression.optional() })).optional() }).optional(),
    }).optional(),
  });
};