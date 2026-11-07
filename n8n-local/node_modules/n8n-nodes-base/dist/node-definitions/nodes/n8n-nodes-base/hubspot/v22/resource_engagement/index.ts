/**
 * HubSpot - Engagement Resource
 * Re-exports all operation types for this resource.
 */

import type { HubspotV22EngagementCreateNode } from './operation_create';
import type { HubspotV22EngagementDeleteNode } from './operation_delete';
import type { HubspotV22EngagementGetNode } from './operation_get';
import type { HubspotV22EngagementGetAllNode } from './operation_get_all';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';

export type HubspotV22EngagementNode =
  | HubspotV22EngagementCreateNode
  | HubspotV22EngagementDeleteNode
  | HubspotV22EngagementGetNode
  | HubspotV22EngagementGetAllNode
  ;