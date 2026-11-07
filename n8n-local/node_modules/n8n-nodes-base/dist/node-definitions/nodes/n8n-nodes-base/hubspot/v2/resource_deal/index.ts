/**
 * HubSpot - Deal Resource
 * Re-exports all operation types for this resource.
 */

import type { HubspotV2DealCreateNode } from './operation_create';
import type { HubspotV2DealDeleteNode } from './operation_delete';
import type { HubspotV2DealGetNode } from './operation_get';
import type { HubspotV2DealGetAllNode } from './operation_get_all';
import type { HubspotV2DealGetRecentlyCreatedUpdatedNode } from './operation_get_recently_created_updated';
import type { HubspotV2DealSearchNode } from './operation_search';
import type { HubspotV2DealUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_get_recently_created_updated';
export * from './operation_search';
export * from './operation_update';

export type HubspotV2DealNode =
  | HubspotV2DealCreateNode
  | HubspotV2DealDeleteNode
  | HubspotV2DealGetNode
  | HubspotV2DealGetAllNode
  | HubspotV2DealGetRecentlyCreatedUpdatedNode
  | HubspotV2DealSearchNode
  | HubspotV2DealUpdateNode
  ;