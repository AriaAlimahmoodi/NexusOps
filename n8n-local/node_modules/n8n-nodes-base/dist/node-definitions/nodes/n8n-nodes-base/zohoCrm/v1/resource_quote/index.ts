/**
 * Zoho CRM - Quote Resource
 * Re-exports all operation types for this resource.
 */

import type { ZohoCrmV1QuoteCreateNode } from './operation_create';
import type { ZohoCrmV1QuoteDeleteNode } from './operation_delete';
import type { ZohoCrmV1QuoteGetNode } from './operation_get';
import type { ZohoCrmV1QuoteGetAllNode } from './operation_get_all';
import type { ZohoCrmV1QuoteUpdateNode } from './operation_update';
import type { ZohoCrmV1QuoteUpsertNode } from './operation_upsert';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';
export * from './operation_upsert';

export type ZohoCrmV1QuoteNode =
  | ZohoCrmV1QuoteCreateNode
  | ZohoCrmV1QuoteDeleteNode
  | ZohoCrmV1QuoteGetNode
  | ZohoCrmV1QuoteGetAllNode
  | ZohoCrmV1QuoteUpdateNode
  | ZohoCrmV1QuoteUpsertNode
  ;