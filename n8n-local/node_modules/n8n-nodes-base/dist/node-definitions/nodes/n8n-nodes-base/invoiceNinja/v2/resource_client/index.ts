/**
 * Invoice Ninja - Client Resource
 * Re-exports all operation types for this resource.
 */

import type { InvoiceNinjaV2ClientCreateNode } from './operation_create';
import type { InvoiceNinjaV2ClientDeleteNode } from './operation_delete';
import type { InvoiceNinjaV2ClientGetNode } from './operation_get';
import type { InvoiceNinjaV2ClientGetAllNode } from './operation_get_all';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';

export type InvoiceNinjaV2ClientNode =
  | InvoiceNinjaV2ClientCreateNode
  | InvoiceNinjaV2ClientDeleteNode
  | InvoiceNinjaV2ClientGetNode
  | InvoiceNinjaV2ClientGetAllNode
  ;