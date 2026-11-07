/**
 * HubSpot - Ticket Resource
 * Re-exports all operation types for this resource.
 */

import type { HubspotV2TicketCreateNode } from './operation_create';
import type { HubspotV2TicketDeleteNode } from './operation_delete';
import type { HubspotV2TicketGetNode } from './operation_get';
import type { HubspotV2TicketGetAllNode } from './operation_get_all';
import type { HubspotV2TicketUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type HubspotV2TicketNode =
  | HubspotV2TicketCreateNode
  | HubspotV2TicketDeleteNode
  | HubspotV2TicketGetNode
  | HubspotV2TicketGetAllNode
  | HubspotV2TicketUpdateNode
  ;