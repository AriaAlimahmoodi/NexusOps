/**
 * SyncroMSP Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { SyncroMspV1ContactNode } from './resource_contact';
import type { SyncroMspV1CustomerNode } from './resource_customer';
import type { SyncroMspV1RmmNode } from './resource_rmm';
import type { SyncroMspV1TicketNode } from './resource_ticket';

export * from './resource_contact';
export * from './resource_customer';
export * from './resource_rmm';
export * from './resource_ticket';

export type SyncroMspV1Node =
  | SyncroMspV1ContactNode
  | SyncroMspV1CustomerNode
  | SyncroMspV1RmmNode
  | SyncroMspV1TicketNode
  ;