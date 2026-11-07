/**
 * QuickBooks Online Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { QuickbooksV1BillNode } from './resource_bill';
import type { QuickbooksV1CustomerNode } from './resource_customer';
import type { QuickbooksV1EmployeeNode } from './resource_employee';
import type { QuickbooksV1EstimateNode } from './resource_estimate';
import type { QuickbooksV1InvoiceNode } from './resource_invoice';
import type { QuickbooksV1ItemNode } from './resource_item';
import type { QuickbooksV1PaymentNode } from './resource_payment';
import type { QuickbooksV1PurchaseNode } from './resource_purchase';
import type { QuickbooksV1TransactionNode } from './resource_transaction';
import type { QuickbooksV1VendorNode } from './resource_vendor';

export * from './resource_bill';
export * from './resource_customer';
export * from './resource_employee';
export * from './resource_estimate';
export * from './resource_invoice';
export * from './resource_item';
export * from './resource_payment';
export * from './resource_purchase';
export * from './resource_transaction';
export * from './resource_vendor';

export type QuickbooksV1Node =
  | QuickbooksV1BillNode
  | QuickbooksV1CustomerNode
  | QuickbooksV1EmployeeNode
  | QuickbooksV1EstimateNode
  | QuickbooksV1InvoiceNode
  | QuickbooksV1ItemNode
  | QuickbooksV1PaymentNode
  | QuickbooksV1PurchaseNode
  | QuickbooksV1TransactionNode
  | QuickbooksV1VendorNode
  ;