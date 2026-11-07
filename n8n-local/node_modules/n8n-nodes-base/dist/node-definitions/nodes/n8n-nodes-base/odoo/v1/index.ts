/**
 * Odoo Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { OdooV1ContactNode } from './resource_contact';
import type { OdooV1CustomNode } from './resource_custom';
import type { OdooV1NoteNode } from './resource_note';
import type { OdooV1OpportunityNode } from './resource_opportunity';

export * from './resource_contact';
export * from './resource_custom';
export * from './resource_note';
export * from './resource_opportunity';

export type OdooV1Node =
  | OdooV1ContactNode
  | OdooV1CustomNode
  | OdooV1NoteNode
  | OdooV1OpportunityNode
  ;