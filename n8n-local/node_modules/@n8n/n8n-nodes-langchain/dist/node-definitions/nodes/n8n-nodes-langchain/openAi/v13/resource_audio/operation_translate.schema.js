/**
 * OpenAI Node - Version 1.3 - Zod Schema
 * Discriminator: resource=audio, operation=translate
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
      resource: z.literal('audio'),
      operation: z.literal('translate'),
      binaryPropertyName: stringOrExpression.optional(),
      options: z.object({ temperature: numberOrExpression.optional() }).optional(),
    }).optional(),
    subnodes: subnodesSchema.optional(),
  });
};