/**
 * Invoice Ninja Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { InvoiceNinjaV1BankTransactionNode } from './resource_bank_transaction';
import type { InvoiceNinjaV1ClientNode } from './resource_client';
import type { InvoiceNinjaV1ExpenseNode } from './resource_expense';
import type { InvoiceNinjaV1InvoiceNode } from './resource_invoice';
import type { InvoiceNinjaV1PaymentNode } from './resource_payment';
import type { InvoiceNinjaV1QuoteNode } from './resource_quote';
import type { InvoiceNinjaV1TaskNode } from './resource_task';

export * from './resource_bank_transaction';
export * from './resource_client';
export * from './resource_expense';
export * from './resource_invoice';
export * from './resource_payment';
export * from './resource_quote';
export * from './resource_task';

export type InvoiceNinjaV1Node =
  | InvoiceNinjaV1BankTransactionNode
  | InvoiceNinjaV1ClientNode
  | InvoiceNinjaV1ExpenseNode
  | InvoiceNinjaV1InvoiceNode
  | InvoiceNinjaV1PaymentNode
  | InvoiceNinjaV1QuoteNode
  | InvoiceNinjaV1TaskNode
  ;