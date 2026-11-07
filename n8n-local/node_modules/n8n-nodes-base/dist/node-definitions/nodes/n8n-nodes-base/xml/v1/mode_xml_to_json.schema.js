/**
 * XML Node - Version 1 - Zod Schema
 * Discriminator: mode=xmlToJson
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
      mode: z.literal('xmlToJson').default('xmlToJson'),
      dataPropertyName: stringOrExpression.optional(),
      options: z.object({ attrkey: stringOrExpression.optional(), charkey: stringOrExpression.optional(), explicitArray: booleanOrExpression.optional(), explicitRoot: booleanOrExpression.optional(), ignoreAttrs: booleanOrExpression.optional(), mergeAttrs: booleanOrExpression.optional(), normalize: booleanOrExpression.optional(), normalizeTags: booleanOrExpression.optional(), trim: booleanOrExpression.optional() }).optional(),
    }).optional(),
  });
};