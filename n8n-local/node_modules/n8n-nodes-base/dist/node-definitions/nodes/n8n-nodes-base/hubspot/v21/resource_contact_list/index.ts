/**
 * HubSpot - ContactList Resource
 * Re-exports all operation types for this resource.
 */

import type { HubspotV21ContactListAddNode } from './operation_add';
import type { HubspotV21ContactListRemoveNode } from './operation_remove';

export * from './operation_add';
export * from './operation_remove';

export type HubspotV21ContactListNode =
  | HubspotV21ContactListAddNode
  | HubspotV21ContactListRemoveNode
  ;