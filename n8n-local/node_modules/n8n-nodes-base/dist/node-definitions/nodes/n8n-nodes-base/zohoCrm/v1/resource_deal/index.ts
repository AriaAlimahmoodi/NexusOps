/**
 * Zoho CRM - Deal Resource
 * Re-exports all operation types for this resource.
 */

import type { ZohoCrmV1DealCreateNode } from './operation_create';
import type { ZohoCrmV1DealDeleteNode } from './operation_delete';
import type { ZohoCrmV1DealGetNode } from './operation_get';
import type { ZohoCrmV1DealGetAllNode } from './operation_get_all';
import type { ZohoCrmV1DealUpdateNode } from './operation_update';
import type { ZohoCrmV1DealUpsertNode } from './operation_upsert';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';
export * from './operation_upsert';

export type ZohoCrmV1DealNode =
  | ZohoCrmV1DealCreateNode
  | ZohoCrmV1DealDeleteNode
  | ZohoCrmV1DealGetNode
  | ZohoCrmV1DealGetAllNode
  | ZohoCrmV1DealUpdateNode
  | ZohoCrmV1DealUpsertNode
  ;