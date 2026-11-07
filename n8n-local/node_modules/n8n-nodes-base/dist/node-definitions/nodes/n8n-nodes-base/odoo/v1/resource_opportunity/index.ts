/**
 * Odoo - Opportunity Resource
 * Re-exports all operation types for this resource.
 */

import type { OdooV1OpportunityCreateNode } from './operation_create';
import type { OdooV1OpportunityDeleteNode } from './operation_delete';
import type { OdooV1OpportunityGetNode } from './operation_get';
import type { OdooV1OpportunityGetAllNode } from './operation_get_all';
import type { OdooV1OpportunityUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type OdooV1OpportunityNode =
  | OdooV1OpportunityCreateNode
  | OdooV1OpportunityDeleteNode
  | OdooV1OpportunityGetNode
  | OdooV1OpportunityGetAllNode
  | OdooV1OpportunityUpdateNode
  ;