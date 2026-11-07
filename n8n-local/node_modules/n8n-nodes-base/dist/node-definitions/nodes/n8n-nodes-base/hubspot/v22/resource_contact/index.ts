/**
 * HubSpot - Contact Resource
 * Re-exports all operation types for this resource.
 */

import type { HubspotV22ContactDeleteNode } from './operation_delete';
import type { HubspotV22ContactGetNode } from './operation_get';
import type { HubspotV22ContactGetAllNode } from './operation_get_all';
import type { HubspotV22ContactGetRecentlyCreatedUpdatedNode } from './operation_get_recently_created_updated';
import type { HubspotV22ContactSearchNode } from './operation_search';
import type { HubspotV22ContactUpsertNode } from './operation_upsert';

export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_get_recently_created_updated';
export * from './operation_search';
export * from './operation_upsert';

export type HubspotV22ContactNode =
  | HubspotV22ContactDeleteNode
  | HubspotV22ContactGetNode
  | HubspotV22ContactGetAllNode
  | HubspotV22ContactGetRecentlyCreatedUpdatedNode
  | HubspotV22ContactSearchNode
  | HubspotV22ContactUpsertNode
  ;