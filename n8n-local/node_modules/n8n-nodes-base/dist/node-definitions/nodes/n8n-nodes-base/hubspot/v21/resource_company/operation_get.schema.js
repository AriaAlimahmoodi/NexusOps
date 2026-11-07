/**
 * HubSpot Node - Version 2.1 - Zod Schema
 * Discriminator: resource=company, operation=get
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
      resource: z.literal('company'),
      operation: z.literal('get'),
      authentication: z.union([z.literal('apiKey'), z.literal('appToken'), z.literal('oAuth2'), expressionSchema]).optional(),
      companyId: z.union([z.object({ __rl: z.literal(true), mode: z.union([z.literal('list'), z.literal('id')]), value: z.union([z.string(), z.number()]), cachedResultName: z.string().optional(), cachedResultUrl: z.string().optional() }), expressionSchema]).optional(),
      additionalFields: z.object({ includeMergeAudits: booleanOrExpression.optional() }).optional(),
    }).optional(),
  });
};