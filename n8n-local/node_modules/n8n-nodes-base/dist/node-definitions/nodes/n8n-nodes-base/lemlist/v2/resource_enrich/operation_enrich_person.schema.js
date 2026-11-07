/**
 * Lemlist Node - Version 2 - Zod Schema
 * Discriminator: resource=enrich, operation=enrichPerson
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
      resource: z.literal('enrich'),
      operation: z.literal('enrichPerson'),
      findEmail: booleanOrExpression.optional(),
      verifyEmail: booleanOrExpression.optional(),
      linkedinEnrichment: booleanOrExpression.optional(),
      findPhone: booleanOrExpression.optional(),
      additionalFields: z.object({ email: stringOrExpression.optional(), firstName: stringOrExpression.optional(), lastName: stringOrExpression.optional(), linkedinUrl: stringOrExpression.optional(), companyName: stringOrExpression.optional(), companyDomain: stringOrExpression.optional() }).optional(),
    }).optional(),
  });
};