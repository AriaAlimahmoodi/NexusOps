/**
 * Zoho CRM - SalesOrder Resource
 * Re-exports all operation types for this resource.
 */

import type { ZohoCrmV1SalesOrderCreateNode } from './operation_create';
import type { ZohoCrmV1SalesOrderDeleteNode } from './operation_delete';
import type { ZohoCrmV1SalesOrderGetNode } from './operation_get';
import type { ZohoCrmV1SalesOrderGetAllNode } from './operation_get_all';
import type { ZohoCrmV1SalesOrderUpdateNode } from './operation_update';
import type { ZohoCrmV1SalesOrderUpsertNode } from './operation_upsert';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';
export * from './operation_upsert';

export type ZohoCrmV1SalesOrderNode =
  | ZohoCrmV1SalesOrderCreateNode
  | ZohoCrmV1SalesOrderDeleteNode
  | ZohoCrmV1SalesOrderGetNode
  | ZohoCrmV1SalesOrderGetAllNode
  | ZohoCrmV1SalesOrderUpdateNode
  | ZohoCrmV1SalesOrderUpsertNode
  ;