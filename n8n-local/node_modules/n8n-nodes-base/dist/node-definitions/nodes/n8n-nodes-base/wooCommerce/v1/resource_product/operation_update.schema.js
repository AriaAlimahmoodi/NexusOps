/**
 * WooCommerce Node - Version 1 - Zod Schema
 * Discriminator: resource=product, operation=update
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
      resource: z.literal('product').default('product'),
      operation: z.literal('update'),
      productId: stringOrExpression.optional(),
      updateFields: z.object({ backorders: z.union([z.literal('no'), z.literal('notify'), z.literal('yes'), expressionSchema]).optional(), buttonText: stringOrExpression.optional(), catalogVisibility: z.union([z.literal('visible'), z.literal('catalog'), z.literal('search'), z.literal('hidden'), expressionSchema]).optional(), categories: z.array(z.string()).optional(), crossSellIds: stringOrExpression.optional(), dateOnSaleFrom: stringOrExpression.optional(), dateOnSaleTo: stringOrExpression.optional(), description: stringOrExpression.optional(), downloadable: booleanOrExpression.optional(), externalUrl: stringOrExpression.optional(), featured: booleanOrExpression.optional(), manageStock: booleanOrExpression.optional(), menuOrder: numberOrExpression.optional(), name: stringOrExpression.optional(), parentId: stringOrExpression.optional(), purchaseNote: stringOrExpression.optional(), regularPrice: stringOrExpression.optional(), reviewsAllowed: booleanOrExpression.optional(), salePrice: stringOrExpression.optional(), shippingClass: stringOrExpression.optional(), shortDescription: stringOrExpression.optional(), sku: stringOrExpression.optional(), slug: stringOrExpression.optional(), soldIndividually: booleanOrExpression.optional(), status: z.union([z.literal('draft'), z.literal('pending'), z.literal('private'), z.literal('publish'), expressionSchema]).optional(), stockQuantity: numberOrExpression.optional(), stockStatus: z.union([z.literal('instock'), z.literal('outofstock'), z.literal('onbackorder'), expressionSchema]).optional(), tags: z.array(z.string()).optional(), taxClass: stringOrExpression.optional(), taxStatus: z.union([z.literal('taxable'), z.literal('shipping'), z.literal('none'), expressionSchema]).optional(), type: z.union([z.literal('simple'), z.literal('grouped'), z.literal('external'), z.literal('variable'), expressionSchema]).optional(), upsellIds: stringOrExpression.optional(), virtual: booleanOrExpression.optional(), weight: stringOrExpression.optional() }).optional(),
      dimensionsUi: z.object({ dimensionsValues: z.object({ height: stringOrExpression.optional(), length: stringOrExpression.optional(), width: stringOrExpression.optional() }).optional() }).optional(),
      imagesUi: z.object({ imagesValues: z.array(z.object({ alt: stringOrExpression.optional(), src: stringOrExpression.optional(), name: stringOrExpression.optional() })).optional() }).optional(),
      metadataUi: z.object({ metadataValues: z.array(z.object({ key: stringOrExpression.optional(), value: stringOrExpression.optional() })).optional() }).optional(),
    }).optional(),
  });
};