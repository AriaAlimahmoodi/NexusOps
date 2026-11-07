/**
 * HubSpot - Ticket Resource
 * Re-exports all operation types for this resource.
 */

import type { HubspotV22TicketCreateNode } from './operation_create';
import type { HubspotV22TicketDeleteNode } from './operation_delete';
import type { HubspotV22TicketGetNode } from './operation_get';
import type { HubspotV22TicketGetAllNode } from './operation_get_all';
import type { HubspotV22TicketUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type HubspotV22TicketNode =
  | HubspotV22TicketCreateNode
  | HubspotV22TicketDeleteNode
  | HubspotV22TicketGetNode
  | HubspotV22TicketGetAllNode
  | HubspotV22TicketUpdateNode
  ;