/**
 * Google Workspace Admin Node - Version 1 - Zod Schema
 * Discriminator: resource=device, operation=get
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
      resource: z.literal('device'),
      operation: z.literal('get').default('get'),
      deviceId: z.union([z.object({ __rl: z.literal(true), mode: z.union([z.literal('list'), z.literal('deviceId')]), value: z.union([z.string(), z.number()]), cachedResultName: z.string().optional(), cachedResultUrl: z.string().optional() }), expressionSchema]).optional(),
      projection: z.union([z.literal('basic'), z.literal('full'), expressionSchema]).optional(),
    }).optional(),
  });
};