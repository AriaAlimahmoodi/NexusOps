/**
 * Zoho CRM - Lead Resource
 * Re-exports all operation types for this resource.
 */

import type { ZohoCrmV1LeadCreateNode } from './operation_create';
import type { ZohoCrmV1LeadDeleteNode } from './operation_delete';
import type { ZohoCrmV1LeadGetNode } from './operation_get';
import type { ZohoCrmV1LeadGetAllNode } from './operation_get_all';
import type { ZohoCrmV1LeadGetFieldsNode } from './operation_get_fields';
import type { ZohoCrmV1LeadUpdateNode } from './operation_update';
import type { ZohoCrmV1LeadUpsertNode } from './operation_upsert';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_get_fields';
export * from './operation_update';
export * from './operation_upsert';

export type ZohoCrmV1LeadNode =
  | ZohoCrmV1LeadCreateNode
  | ZohoCrmV1LeadDeleteNode
  | ZohoCrmV1LeadGetNode
  | ZohoCrmV1LeadGetAllNode
  | ZohoCrmV1LeadGetFieldsNode
  | ZohoCrmV1LeadUpdateNode
  | ZohoCrmV1LeadUpsertNode
  ;