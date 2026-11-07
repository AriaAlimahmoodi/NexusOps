/**
 * OpenAI Node - Version 1.8 - Zod Schema
 * Discriminator: resource=file, operation=list
 *
 * Use .parse() for strict validation or .safeParse() for error handling.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

module.exports = function getSchema({ parameters, z, expressionSchema, stringOrExpression, numberOrExpression, booleanOrExpression, resourceLocatorValueSchema, resourceMapperValueSchema, filterValueSchema, assignmentCollectionValueSchema, iDataObjectSchema, toolInstanceSchema, memoryInstanceSchema }) {

  // Static subnode schema
  const subnodesSchema = z.object({
    tools: z.array(toolInstanceSchema).optional(),
    memory: memoryInstanceSchema.optional(),
  }).strict();

  return z.object({
    parameters: z.object({
      resource: z.literal('file'),
      operation: z.literal('list'),
      options: z.object({ purpose: z.union([z.literal('any'), z.literal('assistants'), z.literal('fine-tune'), expressionSchema]).optional() }).optional(),
    }).optional(),
    subnodes: subnodesSchema.optional(),
  });
};