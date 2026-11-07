/**
 * Invoice Ninja - Expense Resource
 * Re-exports all operation types for this resource.
 */

import type { InvoiceNinjaV1ExpenseCreateNode } from './operation_create';
import type { InvoiceNinjaV1ExpenseDeleteNode } from './operation_delete';
import type { InvoiceNinjaV1ExpenseGetNode } from './operation_get';
import type { InvoiceNinjaV1ExpenseGetAllNode } from './operation_get_all';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';

export type InvoiceNinjaV1ExpenseNode =
  | InvoiceNinjaV1ExpenseCreateNode
  | InvoiceNinjaV1ExpenseDeleteNode
  | InvoiceNinjaV1ExpenseGetNode
  | InvoiceNinjaV1ExpenseGetAllNode
  ;