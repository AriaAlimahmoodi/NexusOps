/**
 * MCP Client Tool Node - Version 1.1 - Zod Validation Schemas
 *
 * These schemas validate node configuration at runtime.
 * Use .parse() for strict validation or .safeParse() for error handling.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

module.exports = function getSchema({ parameters, z, expressionSchema, stringOrExpression, numberOrExpression, booleanOrExpression, resourceLocatorValueSchema, resourceMapperValueSchema, filterValueSchema, assignmentCollectionValueSchema, iDataObjectSchema, resolveSchema, resolveOneOfSchemas }) {

  // Parameters schema
  const parametersSchema = z.object({
    endpointUrl: stringOrExpression,
    serverTransport: z.union([z.literal('httpStreamable'), z.literal('sse'), expressionSchema]).optional(),
    authentication: z.union([z.literal('bearerAuth'), z.literal('headerAuth'), z.literal('none'), expressionSchema]).optional(),
    include: z.union([z.literal('all'), z.literal('selected'), z.literal('except'), expressionSchema]).optional(),
    includeTools: resolveSchema({ parameters, schema: z.array(z.string()), required: false, displayOptions: {"show":{"include":["selected"]}}, defaults: {"include":"all"} }),
    excludeTools: resolveSchema({ parameters, schema: z.array(z.string()), required: false, displayOptions: {"show":{"include":["except"]}}, defaults: {"include":"all"} }),
    options: z.object({ timeout: numberOrExpression.optional() }).optional(),
  });

  // Return combined config schema
  return z.object({
    parameters: parametersSchema.nullable().optional(),
  });
};