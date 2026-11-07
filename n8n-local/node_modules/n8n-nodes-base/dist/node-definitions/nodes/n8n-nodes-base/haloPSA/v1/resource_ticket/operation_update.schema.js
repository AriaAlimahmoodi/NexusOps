/**
 * HaloPSA Node - Version 1 - Zod Schema
 * Discriminator: resource=ticket, operation=update
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
      resource: z.literal('ticket'),
      operation: z.literal('update'),
      ticketId: stringOrExpression.optional(),
      updateFields: z.object({ agent_id: stringOrExpression.optional(), details: stringOrExpression.optional(), startdate: stringOrExpression.optional(), summary: stringOrExpression.optional(), targetdate: stringOrExpression.optional() }).optional(),
    }).optional(),
  });
};