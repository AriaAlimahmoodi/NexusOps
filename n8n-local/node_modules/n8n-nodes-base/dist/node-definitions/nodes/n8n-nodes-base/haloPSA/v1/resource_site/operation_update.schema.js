/**
 * HaloPSA Node - Version 1 - Zod Schema
 * Discriminator: resource=site, operation=update
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
      resource: z.literal('site'),
      operation: z.literal('update'),
      siteId: stringOrExpression.optional(),
      updateFields: z.object({ client_id: stringOrExpression.optional(), maincontact_name: stringOrExpression.optional(), name: stringOrExpression.optional(), notes: stringOrExpression.optional(), phonenumber: stringOrExpression.optional() }).optional(),
    }).optional(),
  });
};