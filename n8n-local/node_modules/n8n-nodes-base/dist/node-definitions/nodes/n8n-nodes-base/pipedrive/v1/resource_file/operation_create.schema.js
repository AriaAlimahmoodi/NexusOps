/**
 * Pipedrive Node - Version 1 - Zod Schema
 * Discriminator: resource=file, operation=create
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
      resource: z.literal('file'),
      operation: z.literal('create').default('create'),
      authentication: z.union([z.literal('apiToken'), z.literal('oAuth2'), expressionSchema]).optional(),
      binaryPropertyName: stringOrExpression.optional(),
      additionalFields: z.object({ activity_id: numberOrExpression.optional(), deal_id: numberOrExpression.optional(), org_id: stringOrExpression.optional(), person_id: numberOrExpression.optional(), product_id: numberOrExpression.optional() }).optional(),
    }).optional(),
  });
};