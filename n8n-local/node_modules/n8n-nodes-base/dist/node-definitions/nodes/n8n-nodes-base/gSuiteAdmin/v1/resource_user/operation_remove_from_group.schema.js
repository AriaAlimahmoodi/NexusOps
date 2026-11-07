/**
 * Google Workspace Admin Node - Version 1 - Zod Schema
 * Discriminator: resource=user, operation=removeFromGroup
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
      resource: z.literal('user').default('user'),
      operation: z.literal('removeFromGroup'),
      userId: z.union([z.object({ __rl: z.literal(true), mode: z.union([z.literal('list'), z.literal('userEmail'), z.literal('userId')]), value: z.union([z.string(), z.number()]), cachedResultName: z.string().optional(), cachedResultUrl: z.string().optional() }), expressionSchema]).optional(),
      groupId: z.union([z.object({ __rl: z.literal(true), mode: z.union([z.literal('list'), z.literal('groupId')]), value: z.union([z.string(), z.number()]), cachedResultName: z.string().optional(), cachedResultUrl: z.string().optional() }), expressionSchema]).optional(),
    }).optional(),
  });
};