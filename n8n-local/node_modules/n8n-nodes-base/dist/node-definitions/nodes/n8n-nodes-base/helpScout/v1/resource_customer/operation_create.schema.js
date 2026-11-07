/**
 * Help Scout Node - Version 1 - Zod Schema
 * Discriminator: resource=customer, operation=create
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
      resource: z.literal('customer'),
      operation: z.literal('create').default('create'),
      resolveData: booleanOrExpression.optional(),
      additionalFields: z.object({ age: numberOrExpression.optional(), firstName: stringOrExpression.optional(), gender: z.union([z.literal('female'), z.literal('male'), z.literal('unknown'), expressionSchema]).optional(), jobTitle: stringOrExpression.optional(), lastName: stringOrExpression.optional(), location: stringOrExpression.optional(), background: stringOrExpression.optional(), organization: stringOrExpression.optional(), photoUrl: stringOrExpression.optional() }).optional(),
      addressUi: z.object({ addressValue: z.object({ line1: stringOrExpression.optional(), line2: stringOrExpression.optional(), city: stringOrExpression.optional(), state: stringOrExpression.optional(), country: stringOrExpression.optional(), postalCode: stringOrExpression.optional() }).optional() }).optional(),
      chatsUi: z.object({ chatsValues: z.array(z.object({ type: z.union([z.literal('aim'), z.literal('gtalk'), z.literal('icq'), z.literal('msn'), z.literal('other'), z.literal('qq'), z.literal('skype'), z.literal('xmpp'), z.literal('yahoo'), expressionSchema]).optional(), value: stringOrExpression.optional() })).optional() }).optional(),
      emailsUi: z.object({ emailsValues: z.array(z.object({ type: z.union([z.literal('home'), z.literal('other'), z.literal('work'), expressionSchema]).optional(), value: stringOrExpression.optional() })).optional() }).optional(),
      phonesUi: z.object({ phonesValues: z.array(z.object({ type: z.union([z.literal('fax'), z.literal('home'), z.literal('other'), z.literal('pager'), z.literal('work'), expressionSchema]).optional(), value: stringOrExpression.optional() })).optional() }).optional(),
      socialProfilesUi: z.object({ socialProfilesValues: z.array(z.object({ type: z.union([z.literal('aboutMe'), z.literal('facebook'), z.literal('flickr'), z.literal('forsquare'), z.literal('google'), z.literal('googleplus'), z.literal('linkedin'), z.literal('other'), z.literal('quora'), z.literal('tungleme'), z.literal('twitter'), z.literal('youtube'), expressionSchema]).optional(), value: stringOrExpression.optional() })).optional() }).optional(),
      websitesUi: z.object({ websitesValues: z.array(z.object({ value: stringOrExpression.optional() })).optional() }).optional(),
    }).optional(),
  });
};