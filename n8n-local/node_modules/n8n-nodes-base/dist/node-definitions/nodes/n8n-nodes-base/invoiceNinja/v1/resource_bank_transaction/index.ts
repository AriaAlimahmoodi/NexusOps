/**
 * Invoice Ninja - BankTransaction Resource
 * Re-exports all operation types for this resource.
 */

import type { InvoiceNinjaV1BankTransactionCreateNode } from './operation_create';
import type { InvoiceNinjaV1BankTransactionDeleteNode } from './operation_delete';
import type { InvoiceNinjaV1BankTransactionGetNode } from './operation_get';
import type { InvoiceNinjaV1BankTransactionGetAllNode } from './operation_get_all';
import type { InvoiceNinjaV1BankTransactionMatchPaymentNode } from './operation_match_payment';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_match_payment';

export type InvoiceNinjaV1BankTransactionNode =
  | InvoiceNinjaV1BankTransactionCreateNode
  | InvoiceNinjaV1BankTransactionDeleteNode
  | InvoiceNinjaV1BankTransactionGetNode
  | InvoiceNinjaV1BankTransactionGetAllNode
  | InvoiceNinjaV1BankTransactionMatchPaymentNode
  ;