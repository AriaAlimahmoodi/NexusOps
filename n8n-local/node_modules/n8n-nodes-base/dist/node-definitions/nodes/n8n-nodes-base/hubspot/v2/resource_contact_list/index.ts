/**
 * HubSpot - ContactList Resource
 * Re-exports all operation types for this resource.
 */

import type { HubspotV2ContactListAddNode } from './operation_add';
import type { HubspotV2ContactListRemoveNode } from './operation_remove';

export * from './operation_add';
export * from './operation_remove';

export type HubspotV2ContactListNode =
  | HubspotV2ContactListAddNode
  | HubspotV2ContactListRemoveNode
  ;