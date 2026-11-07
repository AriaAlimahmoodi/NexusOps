/**
 * HubSpot - Deal Resource
 * Re-exports all operation types for this resource.
 */

import type { HubspotV22DealCreateNode } from './operation_create';
import type { HubspotV22DealDeleteNode } from './operation_delete';
import type { HubspotV22DealGetNode } from './operation_get';
import type { HubspotV22DealGetAllNode } from './operation_get_all';
import type { HubspotV22DealGetRecentlyCreatedUpdatedNode } from './operation_get_recently_created_updated';
import type { HubspotV22DealSearchNode } from './operation_search';
import type { HubspotV22DealUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_get_recently_created_updated';
export * from './operation_search';
export * from './operation_update';

export type HubspotV22DealNode =
  | HubspotV22DealCreateNode
  | HubspotV22DealDeleteNode
  | HubspotV22DealGetNode
  | HubspotV22DealGetAllNode
  | HubspotV22DealGetRecentlyCreatedUpdatedNode
  | HubspotV22DealSearchNode
  | HubspotV22DealUpdateNode
  ;