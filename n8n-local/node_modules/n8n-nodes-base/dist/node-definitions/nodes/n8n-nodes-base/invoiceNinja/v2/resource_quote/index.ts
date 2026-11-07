/**
 * Invoice Ninja - Quote Resource
 * Re-exports all operation types for this resource.
 */

import type { InvoiceNinjaV2QuoteCreateNode } from './operation_create';
import type { InvoiceNinjaV2QuoteDeleteNode } from './operation_delete';
import type { InvoiceNinjaV2QuoteEmailNode } from './operation_email';
import type { InvoiceNinjaV2QuoteGetNode } from './operation_get';
import type { InvoiceNinjaV2QuoteGetAllNode } from './operation_get_all';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_email';
export * from './operation_get';
export * from './operation_get_all';

export type InvoiceNinjaV2QuoteNode =
  | InvoiceNinjaV2QuoteCreateNode
  | InvoiceNinjaV2QuoteDeleteNode
  | InvoiceNinjaV2QuoteEmailNode
  | InvoiceNinjaV2QuoteGetNode
  | InvoiceNinjaV2QuoteGetAllNode
  ;