/**
 * HubSpot - ContactList Resource
 * Re-exports all operation types for this resource.
 */

import type { HubspotV1ContactListAddNode } from './operation_add';
import type { HubspotV1ContactListRemoveNode } from './operation_remove';

export * from './operation_add';
export * from './operation_remove';

export type HubspotV1ContactListNode =
  | HubspotV1ContactListAddNode
  | HubspotV1ContactListRemoveNode
  ;