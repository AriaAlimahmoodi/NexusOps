/**
 * HubSpot - Engagement Resource
 * Re-exports all operation types for this resource.
 */

import type { HubspotV21EngagementCreateNode } from './operation_create';
import type { HubspotV21EngagementDeleteNode } from './operation_delete';
import type { HubspotV21EngagementGetNode } from './operation_get';
import type { HubspotV21EngagementGetAllNode } from './operation_get_all';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';

export type HubspotV21EngagementNode =
  | HubspotV21EngagementCreateNode
  | HubspotV21EngagementDeleteNode
  | HubspotV21EngagementGetNode
  | HubspotV21EngagementGetAllNode
  ;