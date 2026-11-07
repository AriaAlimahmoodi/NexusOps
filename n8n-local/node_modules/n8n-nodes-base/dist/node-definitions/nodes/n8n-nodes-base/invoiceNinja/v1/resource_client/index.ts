/**
 * Invoice Ninja - Client Resource
 * Re-exports all operation types for this resource.
 */

import type { InvoiceNinjaV1ClientCreateNode } from './operation_create';
import type { InvoiceNinjaV1ClientDeleteNode } from './operation_delete';
import type { InvoiceNinjaV1ClientGetNode } from './operation_get';
import type { InvoiceNinjaV1ClientGetAllNode } from './operation_get_all';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';

export type InvoiceNinjaV1ClientNode =
  | InvoiceNinjaV1ClientCreateNode
  | InvoiceNinjaV1ClientDeleteNode
  | InvoiceNinjaV1ClientGetNode
  | InvoiceNinjaV1ClientGetAllNode
  ;