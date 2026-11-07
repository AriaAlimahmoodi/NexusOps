/**
 * Zammad - Ticket Resource
 * Re-exports all operation types for this resource.
 */

import type { ZammadV1TicketCreateNode } from './operation_create';
import type { ZammadV1TicketDeleteNode } from './operation_delete';
import type { ZammadV1TicketGetNode } from './operation_get';
import type { ZammadV1TicketGetAllNode } from './operation_get_all';
import type { ZammadV1TicketUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type ZammadV1TicketNode =
  | ZammadV1TicketCreateNode
  | ZammadV1TicketDeleteNode
  | ZammadV1TicketGetNode
  | ZammadV1TicketGetAllNode
  | ZammadV1TicketUpdateNode
  ;