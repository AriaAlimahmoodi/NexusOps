/**
 * Switch Node - Version 3.3 - Zod Schema
 * Discriminator: mode=expression
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
      mode: z.literal('expression'),
      numberOutputs: z.number().optional(),
      output: numberOrExpression.optional(),
      looseTypeValidation: booleanOrExpression.optional(),
    }).optional(),
  });
};