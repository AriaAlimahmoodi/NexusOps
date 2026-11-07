/**
 * TravisCI Node - Version 1 - Zod Schema
 * Discriminator: resource=build, operation=trigger
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
      resource: z.literal('build').default('build'),
      operation: z.literal('trigger'),
      slug: stringOrExpression.optional(),
      branch: stringOrExpression.optional(),
      additionalFields: z.object({ message: stringOrExpression.optional(), mergeMode: z.union([z.literal('deep_merge'), z.literal('deep_merge_append'), z.literal('deep_merge_prepend'), z.literal('merge'), z.literal('replace'), expressionSchema]).optional() }).optional(),
    }).optional(),
  });
};