/**
 * Structured Output Parser Node - Version 1.1 - Zod Validation Schemas
 *
 * These schemas validate node configuration at runtime.
 * Use .parse() for strict validation or .safeParse() for error handling.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

module.exports = function getSchema({ parameters, z, expressionSchema, stringOrExpression, numberOrExpression, booleanOrExpression, resourceLocatorValueSchema, resourceMapperValueSchema, filterValueSchema, assignmentCollectionValueSchema, iDataObjectSchema, resolveSchema, resolveOneOfSchemas, languageModelInstanceSchema }) {

  // Helper function for conditional subnode schema
  function getSubnodesSchema() {
    return z.object({
      model: resolveSchema({ parameters, schema: z.union([languageModelInstanceSchema, z.array(languageModelInstanceSchema)]), required: true, displayOptions: {"show":{"autoFix":[true]}}, defaults: {"autoFix":false} }),
    }).strict();
  }

  // Parameters schema
  const parametersSchema = z.object({
    jsonSchemaExample: resolveSchema({ parameters, schema: z.union([iDataObjectSchema, z.string()]), required: false, displayOptions: {"show":{"schemaType":["fromJson"]}} }),
    inputSchema: resolveSchema({ parameters, schema: z.union([iDataObjectSchema, z.string()]), required: false, displayOptions: {"show":{"schemaType":["manual"]}} }),
    jsonSchema: z.union([iDataObjectSchema, z.string()]).optional(),
    autoFix: booleanOrExpression.optional(),
    customizeRetryPrompt: resolveSchema({ parameters, schema: booleanOrExpression, required: false, displayOptions: {"show":{"autoFix":[true]}}, defaults: {"autoFix":false} }),
    prompt: resolveSchema({ parameters, schema: stringOrExpression, required: false, displayOptions: {"show":{"autoFix":[true],"customizeRetryPrompt":[true]}}, defaults: {"autoFix":false,"customizeRetryPrompt":false} }),
  });

  // Return combined config schema
  return z.object({
    parameters: parametersSchema.nullable().optional(),
    subnodes: getSubnodesSchema().optional(),
  });
};