/**
 * HubSpot - Contact Resource
 * Re-exports all operation types for this resource.
 */

import type { HubspotV21ContactDeleteNode } from './operation_delete';
import type { HubspotV21ContactGetNode } from './operation_get';
import type { HubspotV21ContactGetAllNode } from './operation_get_all';
import type { HubspotV21ContactGetRecentlyCreatedUpdatedNode } from './operation_get_recently_created_updated';
import type { HubspotV21ContactSearchNode } from './operation_search';
import type { HubspotV21ContactUpsertNode } from './operation_upsert';

export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_get_recently_created_updated';
export * from './operation_search';
export * from './operation_upsert';

export type HubspotV21ContactNode =
  | HubspotV21ContactDeleteNode
  | HubspotV21ContactGetNode
  | HubspotV21ContactGetAllNode
  | HubspotV21ContactGetRecentlyCreatedUpdatedNode
  | HubspotV21ContactSearchNode
  | HubspotV21ContactUpsertNode
  ;