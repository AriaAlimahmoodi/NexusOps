/**
 * Zoho CRM - Account Resource
 * Re-exports all operation types for this resource.
 */

import type { ZohoCrmV1AccountCreateNode } from './operation_create';
import type { ZohoCrmV1AccountDeleteNode } from './operation_delete';
import type { ZohoCrmV1AccountGetNode } from './operation_get';
import type { ZohoCrmV1AccountGetAllNode } from './operation_get_all';
import type { ZohoCrmV1AccountUpdateNode } from './operation_update';
import type { ZohoCrmV1AccountUpsertNode } from './operation_upsert';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';
export * from './operation_upsert';

export type ZohoCrmV1AccountNode =
  | ZohoCrmV1AccountCreateNode
  | ZohoCrmV1AccountDeleteNode
  | ZohoCrmV1AccountGetNode
  | ZohoCrmV1AccountGetAllNode
  | ZohoCrmV1AccountUpdateNode
  | ZohoCrmV1AccountUpsertNode
  ;