/**
 * Zoho CRM - Product Resource
 * Re-exports all operation types for this resource.
 */

import type { ZohoCrmV1ProductCreateNode } from './operation_create';
import type { ZohoCrmV1ProductDeleteNode } from './operation_delete';
import type { ZohoCrmV1ProductGetNode } from './operation_get';
import type { ZohoCrmV1ProductGetAllNode } from './operation_get_all';
import type { ZohoCrmV1ProductUpdateNode } from './operation_update';
import type { ZohoCrmV1ProductUpsertNode } from './operation_upsert';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';
export * from './operation_upsert';

export type ZohoCrmV1ProductNode =
  | ZohoCrmV1ProductCreateNode
  | ZohoCrmV1ProductDeleteNode
  | ZohoCrmV1ProductGetNode
  | ZohoCrmV1ProductGetAllNode
  | ZohoCrmV1ProductUpdateNode
  | ZohoCrmV1ProductUpsertNode
  ;