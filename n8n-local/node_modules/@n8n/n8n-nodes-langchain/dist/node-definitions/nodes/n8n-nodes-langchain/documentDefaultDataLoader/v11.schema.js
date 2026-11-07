/**
 * Default Data Loader Node - Version 1.1 - Zod Validation Schemas
 *
 * These schemas validate node configuration at runtime.
 * Use .parse() for strict validation or .safeParse() for error handling.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

module.exports = function getSchema({ parameters, z, expressionSchema, stringOrExpression, numberOrExpression, booleanOrExpression, resourceLocatorValueSchema, resourceMapperValueSchema, filterValueSchema, assignmentCollectionValueSchema, iDataObjectSchema, resolveSchema, resolveOneOfSchemas, textSplitterInstanceSchema }) {

  // Helper function for conditional subnode schema
  function getSubnodesSchema() {
    return z.object({
      textSplitter: resolveSchema({ parameters, schema: textSplitterInstanceSchema, required: true, displayOptions: {"show":{"textSplittingMode":["custom"]}}, defaults: {"textSplittingMode":"simple"} }),
    }).strict();
  }

  // Parameters schema
  const parametersSchema = z.object({
    dataType: z.union([z.literal('json'), z.literal('binary')]).optional(),
    jsonMode: resolveSchema({ parameters, schema: z.union([z.literal('allInputData'), z.literal('expressionData'), expressionSchema]), required: false, displayOptions: {"show":{"dataType":["json"]}}, defaults: {"dataType":"json"} }),
    binaryMode: resolveSchema({ parameters, schema: z.union([z.literal('allInputData'), z.literal('specificField'), expressionSchema]), required: false, displayOptions: {"show":{"dataType":["binary"]}}, defaults: {"dataType":"json"} }),
    loader: resolveSchema({ parameters, schema: z.union([z.literal('auto'), z.literal('csvLoader'), z.literal('docxLoader'), z.literal('epubLoader'), z.literal('jsonLoader'), z.literal('pdfLoader'), z.literal('textLoader'), expressionSchema]), required: false, displayOptions: {"show":{"dataType":["binary"]}}, defaults: {"dataType":"json"} }),
    jsonData: resolveSchema({ parameters, schema: stringOrExpression, required: true, displayOptions: {"show":{"dataType":["json"],"jsonMode":["expressionData"]}}, defaults: {"dataType":"json","jsonMode":"allInputData"} }),
    binaryDataKey: resolveSchema({ parameters, schema: stringOrExpression, required: false, displayOptions: {"show":{"dataType":["binary"]},"hide":{"binaryMode":["allInputData"]}}, defaults: {"dataType":"json","binaryMode":"allInputData"} }),
    textSplittingMode: z.union([z.literal('simple'), z.literal('custom')]).optional(),
    options: z.object({ pointers: stringOrExpression.optional(), separator: stringOrExpression.optional(), column: stringOrExpression.optional(), splitPages: booleanOrExpression.optional(), metadata: z.object({ metadataValues: z.array(z.object({ name: stringOrExpression.optional(), value: stringOrExpression.optional() })).optional() }).optional() }).optional(),
  });

  // Return combined config schema
  return z.object({
    parameters: parametersSchema.nullable().optional(),
    subnodes: getSubnodesSchema().optional(),
  });
};