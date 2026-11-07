/**
 * Invoice Ninja - Payment Resource
 * Re-exports all operation types for this resource.
 */

import type { InvoiceNinjaV1PaymentCreateNode } from './operation_create';
import type { InvoiceNinjaV1PaymentDeleteNode } from './operation_delete';
import type { InvoiceNinjaV1PaymentGetNode } from './operation_get';
import type { InvoiceNinjaV1PaymentGetAllNode } from './operation_get_all';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';

export type InvoiceNinjaV1PaymentNode =
  | InvoiceNinjaV1PaymentCreateNode
  | InvoiceNinjaV1PaymentDeleteNode
  | InvoiceNinjaV1PaymentGetNode
  | InvoiceNinjaV1PaymentGetAllNode
  ;