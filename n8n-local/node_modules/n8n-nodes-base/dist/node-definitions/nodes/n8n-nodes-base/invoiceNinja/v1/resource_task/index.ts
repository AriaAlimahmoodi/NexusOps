/**
 * Invoice Ninja - Task Resource
 * Re-exports all operation types for this resource.
 */

import type { InvoiceNinjaV1TaskCreateNode } from './operation_create';
import type { InvoiceNinjaV1TaskDeleteNode } from './operation_delete';
import type { InvoiceNinjaV1TaskGetNode } from './operation_get';
import type { InvoiceNinjaV1TaskGetAllNode } from './operation_get_all';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';

export type InvoiceNinjaV1TaskNode =
  | InvoiceNinjaV1TaskCreateNode
  | InvoiceNinjaV1TaskDeleteNode
  | InvoiceNinjaV1TaskGetNode
  | InvoiceNinjaV1TaskGetAllNode
  ;