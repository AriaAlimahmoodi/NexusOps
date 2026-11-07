/**
 * Invoice Ninja - Task Resource
 * Re-exports all operation types for this resource.
 */

import type { InvoiceNinjaV2TaskCreateNode } from './operation_create';
import type { InvoiceNinjaV2TaskDeleteNode } from './operation_delete';
import type { InvoiceNinjaV2TaskGetNode } from './operation_get';
import type { InvoiceNinjaV2TaskGetAllNode } from './operation_get_all';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';

export type InvoiceNinjaV2TaskNode =
  | InvoiceNinjaV2TaskCreateNode
  | InvoiceNinjaV2TaskDeleteNode
  | InvoiceNinjaV2TaskGetNode
  | InvoiceNinjaV2TaskGetAllNode
  ;