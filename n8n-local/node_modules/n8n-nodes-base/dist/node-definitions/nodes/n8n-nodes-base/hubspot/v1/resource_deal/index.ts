/**
 * HubSpot - Deal Resource
 * Re-exports all operation types for this resource.
 */

import type { HubspotV1DealCreateNode } from './operation_create';
import type { HubspotV1DealDeleteNode } from './operation_delete';
import type { HubspotV1DealGetNode } from './operation_get';
import type { HubspotV1DealGetAllNode } from './operation_get_all';
import type { HubspotV1DealGetRecentlyCreatedNode } from './operation_get_recently_created';
import type { HubspotV1DealGetRecentlyModifiedNode } from './operation_get_recently_modified';
import type { HubspotV1DealSearchNode } from './operation_search';
import type { HubspotV1DealUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_get_recently_created';
export * from './operation_get_recently_modified';
export * from './operation_search';
export * from './operation_update';

export type HubspotV1DealNode =
  | HubspotV1DealCreateNode
  | HubspotV1DealDeleteNode
  | HubspotV1DealGetNode
  | HubspotV1DealGetAllNode
  | HubspotV1DealGetRecentlyCreatedNode
  | HubspotV1DealGetRecentlyModifiedNode
  | HubspotV1DealSearchNode
  | HubspotV1DealUpdateNode
  ;