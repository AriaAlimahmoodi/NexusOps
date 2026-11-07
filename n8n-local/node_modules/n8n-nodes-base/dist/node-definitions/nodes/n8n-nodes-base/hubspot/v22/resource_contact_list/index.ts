/**
 * HubSpot - ContactList Resource
 * Re-exports all operation types for this resource.
 */

import type { HubspotV22ContactListAddNode } from './operation_add';
import type { HubspotV22ContactListRemoveNode } from './operation_remove';

export * from './operation_add';
export * from './operation_remove';

export type HubspotV22ContactListNode =
  | HubspotV22ContactListAddNode
  | HubspotV22ContactListRemoveNode
  ;