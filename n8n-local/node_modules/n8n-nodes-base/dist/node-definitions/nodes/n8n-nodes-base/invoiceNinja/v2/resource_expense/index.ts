/**
 * Invoice Ninja - Expense Resource
 * Re-exports all operation types for this resource.
 */

import type { InvoiceNinjaV2ExpenseCreateNode } from './operation_create';
import type { InvoiceNinjaV2ExpenseDeleteNode } from './operation_delete';
import type { InvoiceNinjaV2ExpenseGetNode } from './operation_get';
import type { InvoiceNinjaV2ExpenseGetAllNode } from './operation_get_all';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';

export type InvoiceNinjaV2ExpenseNode =
  | InvoiceNinjaV2ExpenseCreateNode
  | InvoiceNinjaV2ExpenseDeleteNode
  | InvoiceNinjaV2ExpenseGetNode
  | InvoiceNinjaV2ExpenseGetAllNode
  ;