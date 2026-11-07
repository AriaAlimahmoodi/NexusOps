/**
 * HaloPSA - Ticket Resource
 * Re-exports all operation types for this resource.
 */

import type { HaloPSAV1TicketCreateNode } from './operation_create';
import type { HaloPSAV1TicketDeleteNode } from './operation_delete';
import type { HaloPSAV1TicketGetNode } from './operation_get';
import type { HaloPSAV1TicketGetAllNode } from './operation_get_all';
import type { HaloPSAV1TicketUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type HaloPSAV1TicketNode =
  | HaloPSAV1TicketCreateNode
  | HaloPSAV1TicketDeleteNode
  | HaloPSAV1TicketGetNode
  | HaloPSAV1TicketGetAllNode
  | HaloPSAV1TicketUpdateNode
  ;