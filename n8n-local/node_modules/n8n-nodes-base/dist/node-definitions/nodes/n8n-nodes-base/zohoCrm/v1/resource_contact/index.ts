/**
 * Zoho CRM - Contact Resource
 * Re-exports all operation types for this resource.
 */

import type { ZohoCrmV1ContactCreateNode } from './operation_create';
import type { ZohoCrmV1ContactDeleteNode } from './operation_delete';
import type { ZohoCrmV1ContactGetNode } from './operation_get';
import type { ZohoCrmV1ContactGetAllNode } from './operation_get_all';
import type { ZohoCrmV1ContactUpdateNode } from './operation_update';
import type { ZohoCrmV1ContactUpsertNode } from './operation_upsert';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';
export * from './operation_upsert';

export type ZohoCrmV1ContactNode =
  | ZohoCrmV1ContactCreateNode
  | ZohoCrmV1ContactDeleteNode
  | ZohoCrmV1ContactGetNode
  | ZohoCrmV1ContactGetAllNode
  | ZohoCrmV1ContactUpdateNode
  | ZohoCrmV1ContactUpsertNode
  ;