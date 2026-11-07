/**
 * HubSpot Node - Version 2.2 - Zod Schema
 * Discriminator: resource=ticket, operation=update
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
      resource: z.literal('ticket'),
      operation: z.literal('update'),
      authentication: z.union([z.literal('apiKey'), z.literal('appToken'), z.literal('oAuth2'), expressionSchema]).optional(),
      ticketId: z.union([z.object({ __rl: z.literal(true), mode: z.union([z.literal('list'), z.literal('id')]), value: z.union([z.string(), z.number()]), cachedResultName: z.string().optional(), cachedResultUrl: z.string().optional() }), expressionSchema]).optional(),
      updateFields: z.object({ associatedCompanyIds: z.array(z.string()).optional(), associatedContactIds: z.array(z.string()).optional(), category: stringOrExpression.optional(), closeDate: stringOrExpression.optional(), createDate: stringOrExpression.optional(), description: stringOrExpression.optional(), pipelineId: stringOrExpression.optional(), priority: stringOrExpression.optional(), resolution: stringOrExpression.optional(), source: stringOrExpression.optional(), stageId: stringOrExpression.optional(), ticketName: stringOrExpression.optional(), ticketOwnerId: stringOrExpression.optional() }).optional(),
    }).optional(),
  });
};