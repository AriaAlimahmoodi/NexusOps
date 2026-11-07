/**
 * Venafi TLS Protect Cloud Node - Version 1 - Zod Schema
 * Discriminator: resource=certificate, operation=renew
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
      resource: z.literal('certificate'),
      operation: z.literal('renew'),
      applicationId: stringOrExpression.optional(),
      existingCertificateId: stringOrExpression.optional(),
      certificateIssuingTemplateId: stringOrExpression.optional(),
      certificateSigningRequest: stringOrExpression.optional(),
      options: z.object({ validityPeriod: z.union([z.literal('P1Y'), z.literal('P10D'), z.literal('PT12H'), expressionSchema]).optional() }).optional(),
    }).optional(),
  });
};