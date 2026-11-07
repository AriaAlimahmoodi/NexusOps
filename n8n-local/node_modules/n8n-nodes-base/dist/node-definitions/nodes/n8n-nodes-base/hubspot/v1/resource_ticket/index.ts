/**
 * HubSpot - Ticket Resource
 * Re-exports all operation types for this resource.
 */

import type { HubspotV1TicketCreateNode } from './operation_create';
import type { HubspotV1TicketDeleteNode } from './operation_delete';
import type { HubspotV1TicketGetNode } from './operation_get';
import type { HubspotV1TicketGetAllNode } from './operation_get_all';
import type { HubspotV1TicketUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type HubspotV1TicketNode =
  | HubspotV1TicketCreateNode
  | HubspotV1TicketDeleteNode
  | HubspotV1TicketGetNode
  | HubspotV1TicketGetAllNode
  | HubspotV1TicketUpdateNode
  ;