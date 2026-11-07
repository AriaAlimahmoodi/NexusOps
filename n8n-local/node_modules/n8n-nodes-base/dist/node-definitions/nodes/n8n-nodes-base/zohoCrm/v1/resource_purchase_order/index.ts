/**
 * Zoho CRM - PurchaseOrder Resource
 * Re-exports all operation types for this resource.
 */

import type { ZohoCrmV1PurchaseOrderCreateNode } from './operation_create';
import type { ZohoCrmV1PurchaseOrderDeleteNode } from './operation_delete';
import type { ZohoCrmV1PurchaseOrderGetNode } from './operation_get';
import type { ZohoCrmV1PurchaseOrderGetAllNode } from './operation_get_all';
import type { ZohoCrmV1PurchaseOrderUpdateNode } from './operation_update';
import type { ZohoCrmV1PurchaseOrderUpsertNode } from './operation_upsert';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';
export * from './operation_upsert';

export type ZohoCrmV1PurchaseOrderNode =
  | ZohoCrmV1PurchaseOrderCreateNode
  | ZohoCrmV1PurchaseOrderDeleteNode
  | ZohoCrmV1PurchaseOrderGetNode
  | ZohoCrmV1PurchaseOrderGetAllNode
  | ZohoCrmV1PurchaseOrderUpdateNode
  | ZohoCrmV1PurchaseOrderUpsertNode
  ;