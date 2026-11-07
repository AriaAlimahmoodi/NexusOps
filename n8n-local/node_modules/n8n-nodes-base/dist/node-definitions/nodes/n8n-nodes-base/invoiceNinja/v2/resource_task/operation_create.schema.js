/**
 * Invoice Ninja Node - Version 2 - Zod Schema
 * Discriminator: resource=task, operation=create
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
      resource: z.literal('task'),
      operation: z.literal('create').default('create'),
      apiVersion: z.union([z.literal('v4'), z.literal('v5'), expressionSchema]).optional(),
      additionalFields: z.object({ client: stringOrExpression.optional(), customValue1: stringOrExpression.optional(), customValue2: stringOrExpression.optional(), description: stringOrExpression.optional(), project: stringOrExpression.optional() }).optional(),
      timeLogsUi: z.object({ timeLogsValues: z.array(z.object({ startDate: stringOrExpression.optional(), endDate: stringOrExpression.optional(), duration: numberOrExpression.optional() })).optional() }).optional(),
    }).optional(),
  });
};