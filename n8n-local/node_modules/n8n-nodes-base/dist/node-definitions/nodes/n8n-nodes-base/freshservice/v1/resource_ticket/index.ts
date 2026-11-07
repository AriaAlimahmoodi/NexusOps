/**
 * Freshservice - Ticket Resource
 * Re-exports all operation types for this resource.
 */

import type { FreshserviceV1TicketCreateNode } from './operation_create';
import type { FreshserviceV1TicketDeleteNode } from './operation_delete';
import type { FreshserviceV1TicketGetNode } from './operation_get';
import type { FreshserviceV1TicketGetAllNode } from './operation_get_all';
import type { FreshserviceV1TicketUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type FreshserviceV1TicketNode =
  | FreshserviceV1TicketCreateNode
  | FreshserviceV1TicketDeleteNode
  | FreshserviceV1TicketGetNode
  | FreshserviceV1TicketGetAllNode
  | FreshserviceV1TicketUpdateNode
  ;