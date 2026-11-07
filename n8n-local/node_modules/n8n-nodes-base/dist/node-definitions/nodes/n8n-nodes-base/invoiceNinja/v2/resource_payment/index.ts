/**
 * Invoice Ninja - Payment Resource
 * Re-exports all operation types for this resource.
 */

import type { InvoiceNinjaV2PaymentCreateNode } from './operation_create';
import type { InvoiceNinjaV2PaymentDeleteNode } from './operation_delete';
import type { InvoiceNinjaV2PaymentGetNode } from './operation_get';
import type { InvoiceNinjaV2PaymentGetAllNode } from './operation_get_all';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';

export type InvoiceNinjaV2PaymentNode =
  | InvoiceNinjaV2PaymentCreateNode
  | InvoiceNinjaV2PaymentDeleteNode
  | InvoiceNinjaV2PaymentGetNode
  | InvoiceNinjaV2PaymentGetAllNode
  ;