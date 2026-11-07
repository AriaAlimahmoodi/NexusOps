/**
 * Zendesk - TicketField Resource
 * Re-exports all operation types for this resource.
 */

import type { ZendeskV1TicketFieldGetNode } from './operation_get';
import type { ZendeskV1TicketFieldGetAllNode } from './operation_get_all';

export * from './operation_get';
export * from './operation_get_all';

export type ZendeskV1TicketFieldNode =
  | ZendeskV1TicketFieldGetNode
  | ZendeskV1TicketFieldGetAllNode
  ;