/**
 * HubSpot - Engagement Resource
 * Re-exports all operation types for this resource.
 */

import type { HubspotV2EngagementCreateNode } from './operation_create';
import type { HubspotV2EngagementDeleteNode } from './operation_delete';
import type { HubspotV2EngagementGetNode } from './operation_get';
import type { HubspotV2EngagementGetAllNode } from './operation_get_all';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';

export type HubspotV2EngagementNode =
  | HubspotV2EngagementCreateNode
  | HubspotV2EngagementDeleteNode
  | HubspotV2EngagementGetNode
  | HubspotV2EngagementGetAllNode
  ;