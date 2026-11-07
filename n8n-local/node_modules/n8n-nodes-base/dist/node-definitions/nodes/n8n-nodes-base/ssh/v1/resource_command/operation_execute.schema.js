/**
 * SSH Node - Version 1 - Zod Schema
 * Discriminator: resource=command, operation=execute
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
      resource: z.literal('command').default('command'),
      operation: z.literal('execute').default('execute'),
      authentication: z.union([z.literal('password'), z.literal('privateKey'), expressionSchema]).optional(),
      command: stringOrExpression.optional(),
      cwd: stringOrExpression.optional(),
    }).optional(),
  });
};