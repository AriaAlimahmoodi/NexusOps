/**
 * Zoho CRM - Vendor Resource
 * Re-exports all operation types for this resource.
 */

import type { ZohoCrmV1VendorCreateNode } from './operation_create';
import type { ZohoCrmV1VendorDeleteNode } from './operation_delete';
import type { ZohoCrmV1VendorGetNode } from './operation_get';
import type { ZohoCrmV1VendorGetAllNode } from './operation_get_all';
import type { ZohoCrmV1VendorUpdateNode } from './operation_update';
import type { ZohoCrmV1VendorUpsertNode } from './operation_upsert';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';
export * from './operation_upsert';

export type ZohoCrmV1VendorNode =
  | ZohoCrmV1VendorCreateNode
  | ZohoCrmV1VendorDeleteNode
  | ZohoCrmV1VendorGetNode
  | ZohoCrmV1VendorGetAllNode
  | ZohoCrmV1VendorUpdateNode
  | ZohoCrmV1VendorUpsertNode
  ;