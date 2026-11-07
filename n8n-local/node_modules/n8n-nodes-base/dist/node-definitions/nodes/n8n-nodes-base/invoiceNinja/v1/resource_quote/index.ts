/**
 * Invoice Ninja - Quote Resource
 * Re-exports all operation types for this resource.
 */

import type { InvoiceNinjaV1QuoteCreateNode } from './operation_create';
import type { InvoiceNinjaV1QuoteDeleteNode } from './operation_delete';
import type { InvoiceNinjaV1QuoteEmailNode } from './operation_email';
import type { InvoiceNinjaV1QuoteGetNode } from './operation_get';
import type { InvoiceNinjaV1QuoteGetAllNode } from './operation_get_all';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_email';
export * from './operation_get';
export * from './operation_get_all';

export type InvoiceNinjaV1QuoteNode =
  | InvoiceNinjaV1QuoteCreateNode
  | InvoiceNinjaV1QuoteDeleteNode
  | InvoiceNinjaV1QuoteEmailNode
  | InvoiceNinjaV1QuoteGetNode
  | InvoiceNinjaV1QuoteGetAllNode
  ;