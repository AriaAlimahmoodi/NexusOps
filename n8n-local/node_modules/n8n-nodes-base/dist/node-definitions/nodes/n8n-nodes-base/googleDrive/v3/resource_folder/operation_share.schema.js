/**
 * Google Drive Node - Version 3 - Zod Schema
 * Discriminator: resource=folder, operation=share
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
      resource: z.literal('folder'),
      operation: z.literal('share'),
      authentication: z.union([z.literal('oAuth2'), z.literal('serviceAccount'), expressionSchema]).optional(),
      folderNoRootId: z.union([z.object({ __rl: z.literal(true), mode: z.union([z.literal('list'), z.literal('url'), z.literal('id')]), value: z.union([z.string(), z.number()]), cachedResultName: z.string().optional(), cachedResultUrl: z.string().optional() }), expressionSchema]).optional(),
      permissionsUi: z.object({ permissionsValues: z.object({ role: z.union([z.literal('commenter'), z.literal('fileOrganizer'), z.literal('organizer'), z.literal('owner'), z.literal('reader'), z.literal('writer'), expressionSchema]).optional(), type: z.union([z.literal('user'), z.literal('group'), z.literal('domain'), z.literal('anyone'), expressionSchema]).optional(), emailAddress: stringOrExpression.optional(), domain: stringOrExpression.optional(), allowFileDiscovery: booleanOrExpression.optional() }).optional() }).optional(),
      options: z.object({ emailMessage: stringOrExpression.optional(), moveToNewOwnersRoot: booleanOrExpression.optional(), sendNotificationEmail: booleanOrExpression.optional(), transferOwnership: booleanOrExpression.optional(), useDomainAdminAccess: booleanOrExpression.optional() }).optional(),
    }).optional(),
  });
};