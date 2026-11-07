/**
 * Invoice Ninja Node - Version 2
 * Re-exports all discriminator combinations.
 */

import type { InvoiceNinjaV2BankTransactionNode } from './resource_bank_transaction';
import type { InvoiceNinjaV2ClientNode } from './resource_client';
import type { InvoiceNinjaV2ExpenseNode } from './resource_expense';
import type { InvoiceNinjaV2InvoiceNode } from './resource_invoice';
import type { InvoiceNinjaV2PaymentNode } from './resource_payment';
import type { InvoiceNinjaV2QuoteNode } from './resource_quote';
import type { InvoiceNinjaV2TaskNode } from './resource_task';

export * from './resource_bank_transaction';
export * from './resource_client';
export * from './resource_expense';
export * from './resource_invoice';
export * from './resource_payment';
export * from './resource_quote';
export * from './resource_task';

export type InvoiceNinjaV2Node =
  | InvoiceNinjaV2BankTransactionNode
  | InvoiceNinjaV2ClientNode
  | InvoiceNinjaV2ExpenseNode
  | InvoiceNinjaV2InvoiceNode
  | InvoiceNinjaV2PaymentNode
  | InvoiceNinjaV2QuoteNode
  | InvoiceNinjaV2TaskNode
  ;