/**
 * NASA Node - Version 1 - Zod Schema
 * Discriminator: resource=donkiInterplanetaryShock, operation=get
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
      resource: z.literal('donkiInterplanetaryShock'),
      operation: z.literal('get').default('get'),
      additionalFields: z.object({ startDate: stringOrExpression.optional(), endDate: stringOrExpression.optional(), location: z.union([z.literal('ALL'), z.literal('earth'), z.literal('MESSENGER'), z.literal('STEREO A'), z.literal('STEREO B'), expressionSchema]).optional(), catalog: z.union([z.literal('ALL'), z.literal('SWRC_CATALOG'), z.literal('WINSLOW_MESSENGER_ICME_CATALOG'), expressionSchema]).optional() }).optional(),
    }).optional(),
  });
};