/**
 * HubSpot - Contact Resource
 * Re-exports all operation types for this resource.
 */

import type { HubspotV1ContactDeleteNode } from './operation_delete';
import type { HubspotV1ContactGetNode } from './operation_get';
import type { HubspotV1ContactGetAllNode } from './operation_get_all';
import type { HubspotV1ContactGetRecentlyCreatedUpdatedNode } from './operation_get_recently_created_updated';
import type { HubspotV1ContactSearchNode } from './operation_search';
import type { HubspotV1ContactUpsertNode } from './operation_upsert';

export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_get_recently_created_updated';
export * from './operation_search';
export * from './operation_upsert';

export type HubspotV1ContactNode =
  | HubspotV1ContactDeleteNode
  | HubspotV1ContactGetNode
  | HubspotV1ContactGetAllNode
  | HubspotV1ContactGetRecentlyCreatedUpdatedNode
  | HubspotV1ContactSearchNode
  | HubspotV1ContactUpsertNode
  ;