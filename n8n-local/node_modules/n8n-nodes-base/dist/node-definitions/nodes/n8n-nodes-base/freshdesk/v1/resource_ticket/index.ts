/**
 * Freshdesk - Ticket Resource
 * Re-exports all operation types for this resource.
 */

import type { FreshdeskV1TicketCreateNode } from './operation_create';
import type { FreshdeskV1TicketDeleteNode } from './operation_delete';
import type { FreshdeskV1TicketGetNode } from './operation_get';
import type { FreshdeskV1TicketGetAllNode } from './operation_get_all';
import type { FreshdeskV1TicketUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type FreshdeskV1TicketNode =
  | FreshdeskV1TicketCreateNode
  | FreshdeskV1TicketDeleteNode
  | FreshdeskV1TicketGetNode
  | FreshdeskV1TicketGetAllNode
  | FreshdeskV1TicketUpdateNode
  ;