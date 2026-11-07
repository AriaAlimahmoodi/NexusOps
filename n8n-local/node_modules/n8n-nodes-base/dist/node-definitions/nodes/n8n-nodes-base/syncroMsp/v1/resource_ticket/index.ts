/**
 * SyncroMSP - Ticket Resource
 * Re-exports all operation types for this resource.
 */

import type { SyncroMspV1TicketCreateNode } from './operation_create';
import type { SyncroMspV1TicketDeleteNode } from './operation_delete';
import type { SyncroMspV1TicketGetNode } from './operation_get';
import type { SyncroMspV1TicketGetAllNode } from './operation_get_all';
import type { SyncroMspV1TicketUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type SyncroMspV1TicketNode =
  | SyncroMspV1TicketCreateNode
  | SyncroMspV1TicketDeleteNode
  | SyncroMspV1TicketGetNode
  | SyncroMspV1TicketGetAllNode
  | SyncroMspV1TicketUpdateNode
  ;