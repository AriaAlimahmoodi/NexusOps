/**
 * HubSpot - Engagement Resource
 * Re-exports all operation types for this resource.
 */

import type { HubspotV1EngagementCreateNode } from './operation_create';
import type { HubspotV1EngagementDeleteNode } from './operation_delete';
import type { HubspotV1EngagementGetNode } from './operation_get';
import type { HubspotV1EngagementGetAllNode } from './operation_get_all';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';

export type HubspotV1EngagementNode =
  | HubspotV1EngagementCreateNode
  | HubspotV1EngagementDeleteNode
  | HubspotV1EngagementGetNode
  | HubspotV1EngagementGetAllNode
  ;