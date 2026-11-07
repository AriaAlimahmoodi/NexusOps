/**
 * NASA Node - Version 1 - Zod Schema
 * Discriminator: resource=donkiWsaEnlilSimulation, operation=get
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
      resource: z.literal('donkiWsaEnlilSimulation'),
      operation: z.literal('get').default('get'),
      additionalFields: z.object({ startDate: stringOrExpression.optional(), endDate: stringOrExpression.optional() }).optional(),
    }).optional(),
  });
};