/**
 * Switch Node - Version 3 - Zod Schema
 * Discriminator: mode=rules
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
      mode: z.literal('rules').default('rules'),
      rules: z.object({ values: z.array(z.object({ conditions: filterValueSchema.optional(), renameOutput: booleanOrExpression.optional(), outputKey: stringOrExpression.optional() })).optional() }).optional(),
      options: z.object({ fallbackOutput: stringOrExpression.optional(), ignoreCase: booleanOrExpression.optional(), looseTypeValidation: booleanOrExpression.optional(), renameFallbackOutput: stringOrExpression.optional(), allMatchingOutputs: booleanOrExpression.optional() }).optional(),
    }).optional(),
  });
};