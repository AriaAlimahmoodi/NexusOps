/**
 * HubSpot - Ticket Resource
 * Re-exports all operation types for this resource.
 */

import type { HubspotV21TicketCreateNode } from './operation_create';
import type { HubspotV21TicketDeleteNode } from './operation_delete';
import type { HubspotV21TicketGetNode } from './operation_get';
import type { HubspotV21TicketGetAllNode } from './operation_get_all';
import type { HubspotV21TicketUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type HubspotV21TicketNode =
  | HubspotV21TicketCreateNode
  | HubspotV21TicketDeleteNode
  | HubspotV21TicketGetNode
  | HubspotV21TicketGetAllNode
  | HubspotV21TicketUpdateNode
  ;