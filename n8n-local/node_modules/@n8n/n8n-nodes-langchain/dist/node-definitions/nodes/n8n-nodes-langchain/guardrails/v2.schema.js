/**
 * Guardrails Node - Version 2 - Zod Validation Schemas
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
      model: resolveSchema({ parameters, schema: z.union([languageModelInstanceSchema, z.array(languageModelInstanceSchema)]), required: true, displayOptions: {"show":{"/guardrails.(jailbreak|nsfw|topicalAlignment|custom)":[{"_cnd":{"exists":true}}]}} }),
    }).strict();
  }

  // Parameters schema
  const parametersSchema = z.object({
    operation: z.union([z.literal('classify'), z.literal('sanitize')]).optional(),
    text: stringOrExpression,
    guardrails: z.object({ keywords: stringOrExpression.optional(), jailbreak: z.object({ value: z.object({ threshold: numberOrExpression.optional(), customizePrompt: booleanOrExpression.optional(), prompt: stringOrExpression.optional() }).optional() }).optional(), nsfw: z.object({ value: z.object({ threshold: numberOrExpression.optional(), customizePrompt: booleanOrExpression.optional(), prompt: stringOrExpression.optional() }).optional() }).optional(), pii: z.object({ value: z.object({ type: z.union([z.literal('all'), z.literal('selected'), expressionSchema]).optional(), entities: z.array(z.union([z.literal('CREDIT_CARD'), z.literal('CRYPTO'), z.literal('DATE_TIME'), z.literal('EMAIL_ADDRESS'), z.literal('IBAN_CODE'), z.literal('IP_ADDRESS'), z.literal('LOCATION'), z.literal('PHONE_NUMBER'), z.literal('MEDICAL_LICENSE'), z.literal('US_BANK_NUMBER'), z.literal('US_DRIVER_LICENSE'), z.literal('US_ITIN'), z.literal('US_PASSPORT'), z.literal('US_SSN'), z.literal('UK_NHS'), z.literal('UK_NINO'), z.literal('ES_NIF'), z.literal('ES_NIE'), z.literal('IT_FISCAL_CODE'), z.literal('IT_DRIVER_LICENSE'), z.literal('IT_VAT_CODE'), z.literal('IT_PASSPORT'), z.literal('IT_IDENTITY_CARD'), z.literal('PL_PESEL'), z.literal('SG_NRIC_FIN'), z.literal('SG_UEN'), z.literal('AU_ABN'), z.literal('AU_ACN'), z.literal('AU_TFN'), z.literal('AU_MEDICARE'), z.literal('IN_PAN'), z.literal('IN_AADHAAR'), z.literal('IN_VEHICLE_REGISTRATION'), z.literal('IN_VOTER'), z.literal('IN_PASSPORT'), z.literal('FI_PERSONAL_IDENTITY_CODE')])).optional() }).optional() }).optional(), secretKeys: z.object({ value: z.object({ permissiveness: z.union([z.literal('strict'), z.literal('balanced'), z.literal('permissive'), expressionSchema]).optional() }).optional() }).optional(), topicalAlignment: z.object({ value: z.object({ threshold: numberOrExpression.optional(), prompt: stringOrExpression.optional() }).optional() }).optional(), urls: z.object({ value: z.object({ allowedUrls: stringOrExpression.optional(), allowedSchemes: z.array(z.union([z.literal('https'), z.literal('http'), z.literal('ftp'), z.literal('data'), z.literal('javascript'), z.literal('vbscript'), z.literal('mailto')])).optional(), blockUserinfo: booleanOrExpression.optional(), allowSubdomains: booleanOrExpression.optional() }).optional() }).optional(), custom: z.object({ guardrail: z.array(z.object({ name: stringOrExpression.optional(), threshold: numberOrExpression.optional(), prompt: stringOrExpression.optional() })).optional() }).optional(), customRegex: z.object({ regex: z.array(z.object({ name: stringOrExpression.optional(), value: stringOrExpression.optional() })).optional() }).optional() }).optional(),
    customizeSystemMessage: resolveSchema({ parameters, schema: booleanOrExpression, required: false, displayOptions: {"show":{"/operation":["classify"]}} }),
    systemMessage: resolveSchema({ parameters, schema: stringOrExpression, required: false, displayOptions: {"show":{"/customizeSystemMessage":[true]}} }),
  });

  // Return combined config schema
  return z.object({
    parameters: parametersSchema.nullable().optional(),
    subnodes: getSubnodesSchema().optional(),
  });
};