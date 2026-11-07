/**
 * Zoho CRM Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { ZohoCrmV1AccountNode } from './resource_account';
import type { ZohoCrmV1ContactNode } from './resource_contact';
import type { ZohoCrmV1DealNode } from './resource_deal';
import type { ZohoCrmV1InvoiceNode } from './resource_invoice';
import type { ZohoCrmV1LeadNode } from './resource_lead';
import type { ZohoCrmV1ProductNode } from './resource_product';
import type { ZohoCrmV1PurchaseOrderNode } from './resource_purchase_order';
import type { ZohoCrmV1QuoteNode } from './resource_quote';
import type { ZohoCrmV1SalesOrderNode } from './resource_sales_order';
import type { ZohoCrmV1VendorNode } from './resource_vendor';

export * from './resource_account';
export * from './resource_contact';
export * from './resource_deal';
export * from './resource_invoice';
export * from './resource_lead';
export * from './resource_product';
export * from './resource_purchase_order';
export * from './resource_quote';
export * from './resource_sales_order';
export * from './resource_vendor';

export type ZohoCrmV1Node =
  | ZohoCrmV1AccountNode
  | ZohoCrmV1ContactNode
  | ZohoCrmV1DealNode
  | ZohoCrmV1InvoiceNode
  | ZohoCrmV1LeadNode
  | ZohoCrmV1ProductNode
  | ZohoCrmV1PurchaseOrderNode
  | ZohoCrmV1QuoteNode
  | ZohoCrmV1SalesOrderNode
  | ZohoCrmV1VendorNode
  ;