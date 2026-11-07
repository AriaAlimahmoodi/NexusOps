/**
 * Freshdesk Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { FreshdeskV1ContactNode } from './resource_contact';
import type { FreshdeskV1TicketNode } from './resource_ticket';

export * from './resource_contact';
export * from './resource_ticket';

export type FreshdeskV1Node =
  | FreshdeskV1ContactNode
  | FreshdeskV1TicketNode
  ;