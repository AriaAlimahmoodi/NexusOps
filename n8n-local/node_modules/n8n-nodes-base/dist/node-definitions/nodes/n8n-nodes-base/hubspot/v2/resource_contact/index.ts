/**
 * HubSpot - Contact Resource
 * Re-exports all operation types for this resource.
 */

import type { HubspotV2ContactDeleteNode } from './operation_delete';
import type { HubspotV2ContactGetNode } from './operation_get';
import type { HubspotV2ContactGetAllNode } from './operation_get_all';
import type { HubspotV2ContactGetRecentlyCreatedUpdatedNode } from './operation_get_recently_created_updated';
import type { HubspotV2ContactSearchNode } from './operation_search';
import type { HubspotV2ContactUpsertNode } from './operation_upsert';

export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_get_recently_created_updated';
export * from './operation_search';
export * from './operation_upsert';

export type HubspotV2ContactNode =
  | HubspotV2ContactDeleteNode
  | HubspotV2ContactGetNode
  | HubspotV2ContactGetAllNode
  | HubspotV2ContactGetRecentlyCreatedUpdatedNode
  | HubspotV2ContactSearchNode
  | HubspotV2ContactUpsertNode
  ;