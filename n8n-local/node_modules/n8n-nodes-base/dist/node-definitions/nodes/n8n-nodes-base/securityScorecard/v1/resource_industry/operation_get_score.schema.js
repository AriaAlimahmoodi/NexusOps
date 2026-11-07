/**
 * SecurityScorecard Node - Version 1 - Zod Schema
 * Discriminator: resource=industry, operation=getScore
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
      resource: z.literal('industry'),
      operation: z.literal('getScore'),
      industry: z.union([z.literal('food'), z.literal('healthcare'), z.literal('manofacturing'), z.literal('retail'), z.literal('technology'), expressionSchema]).optional(),
    }).optional(),
  });
};