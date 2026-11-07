/**
 * TheHive 5 Node - Version 1 - Zod Schema
 * Discriminator: resource=case, operation=addAttachment
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
      resource: z.literal('case'),
      operation: z.literal('addAttachment'),
      caseId: z.union([z.object({ __rl: z.literal(true), mode: z.union([z.literal('list'), z.literal('url'), z.literal('id')]), value: z.union([z.string(), z.number()]), cachedResultName: z.string().optional(), cachedResultUrl: z.string().optional() }), expressionSchema]).optional(),
      attachmentsUi: z.object({ values: z.array(z.object({ field: stringOrExpression.optional() })).optional() }).optional(),
      options: z.object({ canRename: booleanOrExpression.optional() }).optional(),
    }).optional(),
  });
};