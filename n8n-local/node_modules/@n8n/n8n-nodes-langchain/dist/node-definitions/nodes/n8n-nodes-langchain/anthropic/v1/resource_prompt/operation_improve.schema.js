/**
 * Anthropic Node - Version 1 - Zod Schema
 * Discriminator: resource=prompt, operation=improve
 *
 * Use .parse() for strict validation or .safeParse() for error handling.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

module.exports = function getSchema({ parameters, z, expressionSchema, stringOrExpression, numberOrExpression, booleanOrExpression, resourceLocatorValueSchema, resourceMapperValueSchema, filterValueSchema, assignmentCollectionValueSchema, iDataObjectSchema, toolInstanceSchema }) {

  // Static subnode schema
  const subnodesSchema = z.object({
    tools: z.array(toolInstanceSchema).optional(),
  }).strict();

  return z.object({
    parameters: z.object({
      resource: z.literal('prompt'),
      operation: z.literal('improve'),
      messages: z.object({ values: z.array(z.object({ content: stringOrExpression.optional(), role: z.union([z.literal('user'), z.literal('assistant'), expressionSchema]).optional() })).optional() }).optional(),
      simplify: booleanOrExpression.optional(),
      options: z.object({ system: stringOrExpression.optional(), feedback: stringOrExpression.optional() }).optional(),
    }).optional(),
    subnodes: subnodesSchema.optional(),
  });
};