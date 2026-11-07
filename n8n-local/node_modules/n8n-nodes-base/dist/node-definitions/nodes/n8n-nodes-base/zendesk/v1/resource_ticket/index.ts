/**
 * Zendesk - Ticket Resource
 * Re-exports all operation types for this resource.
 */

import type { ZendeskV1TicketCreateNode } from './operation_create';
import type { ZendeskV1TicketDeleteNode } from './operation_delete';
import type { ZendeskV1TicketGetNode } from './operation_get';
import type { ZendeskV1TicketGetAllNode } from './operation_get_all';
import type { ZendeskV1TicketRecoverNode } from './operation_recover';
import type { ZendeskV1TicketUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_recover';
export * from './operation_update';

export type ZendeskV1TicketNode =
  | ZendeskV1TicketCreateNode
  | ZendeskV1TicketDeleteNode
  | ZendeskV1TicketGetNode
  | ZendeskV1TicketGetAllNode
  | ZendeskV1TicketRecoverNode
  | ZendeskV1TicketUpdateNode
  ;