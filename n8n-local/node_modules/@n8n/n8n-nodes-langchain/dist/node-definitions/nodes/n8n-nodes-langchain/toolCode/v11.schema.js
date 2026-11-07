/**
 * Code Tool Node - Version 1.1 - Zod Validation Schemas
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
    name: stringOrExpression.optional(),
    description: stringOrExpression.optional(),
    language: z.union([z.literal('javaScript'), z.literal('python')]).optional(),
    jsCode: resolveSchema({ parameters, schema: z.string(), required: false, displayOptions: {"show":{"language":["javaScript"]}}, defaults: {"language":"javaScript"} }),
    pythonCode: resolveSchema({ parameters, schema: z.string(), required: false, displayOptions: {"show":{"language":["python"]}}, defaults: {"language":"javaScript"} }),
    specifyInputSchema: z.boolean().optional(),
    schemaType: resolveSchema({ parameters, schema: z.union([z.literal('fromJson'), z.literal('manual')]), required: false, displayOptions: {"show":{"specifyInputSchema":[true]}}, defaults: {"specifyInputSchema":false} }),
    jsonSchemaExample: resolveSchema({ parameters, schema: z.union([iDataObjectSchema, z.string()]), required: false, displayOptions: {"show":{"specifyInputSchema":[true],"schemaType":["fromJson"]}}, defaults: {"specifyInputSchema":false,"schemaType":"fromJson"} }),
    inputSchema: resolveSchema({ parameters, schema: z.union([iDataObjectSchema, z.string()]), required: false, displayOptions: {"show":{"specifyInputSchema":[true],"schemaType":["manual"]}}, defaults: {"specifyInputSchema":false,"schemaType":"fromJson"} }),
  });

  // Return combined config schema
  return z.object({
    parameters: parametersSchema.nullable().optional(),
  });
};