/**
 * Invoice Ninja - BankTransaction Resource
 * Re-exports all operation types for this resource.
 */

import type { InvoiceNinjaV2BankTransactionCreateNode } from './operation_create';
import type { InvoiceNinjaV2BankTransactionDeleteNode } from './operation_delete';
import type { InvoiceNinjaV2BankTransactionGetNode } from './operation_get';
import type { InvoiceNinjaV2BankTransactionGetAllNode } from './operation_get_all';
import type { InvoiceNinjaV2BankTransactionMatchPaymentNode } from './operation_match_payment';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_match_payment';

export type InvoiceNinjaV2BankTransactionNode =
  | InvoiceNinjaV2BankTransactionCreateNode
  | InvoiceNinjaV2BankTransactionDeleteNode
  | InvoiceNinjaV2BankTransactionGetNode
  | InvoiceNinjaV2BankTransactionGetAllNode
  | InvoiceNinjaV2BankTransactionMatchPaymentNode
  ;