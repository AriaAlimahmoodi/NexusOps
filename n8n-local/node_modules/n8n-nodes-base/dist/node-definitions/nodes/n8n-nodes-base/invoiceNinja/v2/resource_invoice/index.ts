/**
 * Invoice Ninja - Invoice Resource
 * Re-exports all operation types for this resource.
 */

import type { InvoiceNinjaV2InvoiceCreateNode } from './operation_create';
import type { InvoiceNinjaV2InvoiceDeleteNode } from './operation_delete';
import type { InvoiceNinjaV2InvoiceEmailNode } from './operation_email';
import type { InvoiceNinjaV2InvoiceGetNode } from './operation_get';
import type { InvoiceNinjaV2InvoiceGetAllNode } from './operation_get_all';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_email';
export * from './operation_get';
export * from './operation_get_all';

export type InvoiceNinjaV2InvoiceNode =
  | InvoiceNinjaV2InvoiceCreateNode
  | InvoiceNinjaV2InvoiceDeleteNode
  | InvoiceNinjaV2InvoiceEmailNode
  | InvoiceNinjaV2InvoiceGetNode
  | InvoiceNinjaV2InvoiceGetAllNode
  ;