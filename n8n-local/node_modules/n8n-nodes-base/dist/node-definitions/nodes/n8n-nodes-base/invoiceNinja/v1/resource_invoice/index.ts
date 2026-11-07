/**
 * Invoice Ninja - Invoice Resource
 * Re-exports all operation types for this resource.
 */

import type { InvoiceNinjaV1InvoiceCreateNode } from './operation_create';
import type { InvoiceNinjaV1InvoiceDeleteNode } from './operation_delete';
import type { InvoiceNinjaV1InvoiceEmailNode } from './operation_email';
import type { InvoiceNinjaV1InvoiceGetNode } from './operation_get';
import type { InvoiceNinjaV1InvoiceGetAllNode } from './operation_get_all';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_email';
export * from './operation_get';
export * from './operation_get_all';

export type InvoiceNinjaV1InvoiceNode =
  | InvoiceNinjaV1InvoiceCreateNode
  | InvoiceNinjaV1InvoiceDeleteNode
  | InvoiceNinjaV1InvoiceEmailNode
  | InvoiceNinjaV1InvoiceGetNode
  | InvoiceNinjaV1InvoiceGetAllNode
  ;