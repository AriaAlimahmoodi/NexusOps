/**
 * Zoho CRM - Invoice Resource
 * Re-exports all operation types for this resource.
 */

import type { ZohoCrmV1InvoiceCreateNode } from './operation_create';
import type { ZohoCrmV1InvoiceDeleteNode } from './operation_delete';
import type { ZohoCrmV1InvoiceGetNode } from './operation_get';
import type { ZohoCrmV1InvoiceGetAllNode } from './operation_get_all';
import type { ZohoCrmV1InvoiceUpdateNode } from './operation_update';
import type { ZohoCrmV1InvoiceUpsertNode } from './operation_upsert';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';
export * from './operation_upsert';

export type ZohoCrmV1InvoiceNode =
  | ZohoCrmV1InvoiceCreateNode
  | ZohoCrmV1InvoiceDeleteNode
  | ZohoCrmV1InvoiceGetNode
  | ZohoCrmV1InvoiceGetAllNode
  | ZohoCrmV1InvoiceUpdateNode
  | ZohoCrmV1InvoiceUpsertNode
  ;