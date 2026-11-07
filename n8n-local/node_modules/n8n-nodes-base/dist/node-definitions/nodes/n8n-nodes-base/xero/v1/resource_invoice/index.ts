/**
 * Xero - Invoice Resource
 * Re-exports all operation types for this resource.
 */

import type { XeroV1InvoiceCreateNode } from './operation_create';
import type { XeroV1InvoiceGetNode } from './operation_get';
import type { XeroV1InvoiceGetAllNode } from './operation_get_all';
import type { XeroV1InvoiceUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type XeroV1InvoiceNode =
  | XeroV1InvoiceCreateNode
  | XeroV1InvoiceGetNode
  | XeroV1InvoiceGetAllNode
  | XeroV1InvoiceUpdateNode
  ;