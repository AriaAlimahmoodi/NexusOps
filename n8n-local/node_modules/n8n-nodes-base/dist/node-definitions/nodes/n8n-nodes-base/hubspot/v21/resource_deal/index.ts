/**
 * HubSpot - Deal Resource
 * Re-exports all operation types for this resource.
 */

import type { HubspotV21DealCreateNode } from './operation_create';
import type { HubspotV21DealDeleteNode } from './operation_delete';
import type { HubspotV21DealGetNode } from './operation_get';
import type { HubspotV21DealGetAllNode } from './operation_get_all';
import type { HubspotV21DealGetRecentlyCreatedUpdatedNode } from './operation_get_recently_created_updated';
import type { HubspotV21DealSearchNode } from './operation_search';
import type { HubspotV21DealUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_get_recently_created_updated';
export * from './operation_search';
export * from './operation_update';

export type HubspotV21DealNode =
  | HubspotV21DealCreateNode
  | HubspotV21DealDeleteNode
  | HubspotV21DealGetNode
  | HubspotV21DealGetAllNode
  | HubspotV21DealGetRecentlyCreatedUpdatedNode
  | HubspotV21DealSearchNode
  | HubspotV21DealUpdateNode
  ;