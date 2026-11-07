/**
 * Chat Memory Manager Node - Version 1 - Zod Schema
 * Discriminator: mode=load
 *
 * Use .parse() for strict validation or .safeParse() for error handling.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

module.exports = function getSchema({ parameters, z, expressionSchema, stringOrExpression, numberOrExpression, booleanOrExpression, resourceLocatorValueSchema, resourceMapperValueSchema, filterValueSchema, assignmentCollectionValueSchema, iDataObjectSchema, memoryInstanceSchema }) {

  // Static subnode schema
  const subnodesSchema = z.object({
    memory: memoryInstanceSchema.optional(),
  }).strict();

  return z.object({
    parameters: z.object({
      mode: z.literal('load').default('load'),
      simplifyOutput: booleanOrExpression.optional(),
      options: z.object({ groupMessages: booleanOrExpression.optional() }).optional(),
    }).optional(),
    subnodes: subnodesSchema.optional(),
  });
};